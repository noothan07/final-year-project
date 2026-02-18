import Student from '../models/Student.js'
import PeriodAttendance from '../models/Attendance.js'
import { parseISODateOnly } from '../utils/dates.js'
import { parseRollList, uniq } from '../utils/rollParsing.js'
import ExcelJS from 'exceljs'

export async function markAttendance(req, res) {
  try {
    console.log('🔍 Mark attendance request:', req.body)
    
    const { department, semester, shift, subject, date, period, absentees, presents } = req.body

    // Validate required fields
    if (!department || !semester || !shift || !subject || !date || !period) {
      console.log('❌ Missing required fields:', { department, semester, shift, subject, date, period })
      return res.status(400).json({ message: 'All fields are required: department, semester, shift, subject, date, period' })
    }

    // Validate period range
    const periodNumber = parseInt(period.replace('Period ', '').trim())
    if (isNaN(periodNumber) || periodNumber < 1 || periodNumber > 7) {
      console.log('❌ Invalid period format:', period)
      return res.status(400).json({ message: 'Invalid period. Use Period 1-7.' })
    }
    console.log('🔍 Converted period:', period, '→', periodNumber)

    // Validate that either absentees or presents is provided (not both)
    if (absentees && presents) {
      console.log('❌ Both absentees and presents provided')
      return res.status(400).json({ message: 'Provide either absentees or presents, not both' })
    }

    if (!absentees && !presents) {
      console.log('❌ Neither absentees nor presents provided')
      return res.status(400).json({ message: 'Provide either absentees or presents' })
    }

    const dateObj = parseISODateOnly(date)
    if (!dateObj) {
      console.log('❌ Invalid date format:', date)
      return res.status(400).json({ message: 'Invalid date. Use YYYY-MM-DD.' })
    }

    // Get all students for this class
    const students = await Student.find({
      department: new RegExp(`^${department}$`, 'i'), // Case-insensitive
      semester,
      shift, // Keep as 1st shift or 2nd shift
      status: 'active'
    })
    console.log(`🔍 Found ${students.length} students for class`)

    if (students.length === 0) {
      return res.status(404).json({ message: 'No active students found for this class' })
    }

    const studentPins = students.map(s => s.pin)
    const pinList = absentees || presents

    // Validate PINs
    const pins = pinList.split(',').map(pin => pin.trim()).filter(pin => pin)
    console.log('🔍 Processing PINs:', pins)

    const invalidPins = pins.filter(pin => !studentPins.includes(pin))
    if (invalidPins.length > 0) {
      console.log('❌ Invalid PINs:', invalidPins)
      return res.status(400).json({ 
        message: `Invalid PINs: ${invalidPins.join(', ')}. These students are not in the selected class.` 
      })
    }

    // Check if attendance already exists for this period
    const existingAttendance = await PeriodAttendance.findOne({
      department,
      semester,
      shift,
      subject,
      period: periodNumber, // Use the converted number
      date: dateObj
    })

    if (existingAttendance) {
      console.log('❌ Attendance already exists for this period')
      return res.status(400).json({ message: 'Attendance already marked for this period' })
    }

    // Determine absentees and presents arrays
    let absenteesArray = []
    let presentsArray = []

    if (absentees) {
      absenteesArray = pins
      presentsArray = studentPins.filter(pin => !absenteesArray.includes(pin))
    } else {
      presentsArray = pins
      absenteesArray = studentPins.filter(pin => !presentsArray.includes(pin))
    }

    console.log('🔍 Final attendance data:', {
      absentees: absenteesArray,
      presents: presentsArray
    })

    // Create attendance record
    const attendance = new PeriodAttendance({
      department,
      semester,
      shift,
      subject,
      period: periodNumber, // Use the converted number
      date: dateObj,
      absentees: absenteesArray,
      presents: presentsArray,
      markedBy: null // Set to null to avoid ObjectId validation issues
    })

    await attendance.save()
    console.log('✅ Attendance saved successfully')

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: {
        totalStudents: students.length,
        absentees: absenteesArray.length,
        presents: presentsArray.length,
        period: periodNumber, // Show the number
        date,
        subject
      }
    })
  } catch (error) {
    console.error('❌ Mark attendance error:', error);
    
    // Send detailed error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = {
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    // Don't crash the server, send proper error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error: ' + errorMessage,
        details: errorDetails
      });
    }
    
    res.status(500).json({
      message: 'Server error: ' + errorMessage,
      details: errorDetails
    });
  }
}

export async function getAttendanceSummary(req, res) {
  try {
    const { department, semester, shift, startDate, endDate } = req.query

    // Build query
    const query = {};
    if (department) query.department = new RegExp(`^${department}$`, 'i');
    if (semester) query.semester = semester;
    if (shift) query.shift = shift;

    console.log('🔍 Get attendance summary with query:', query);

    const attendances = await PeriodAttendance.find(query)
      .sort({ date: -1 })
      .limit(100); // Limit to prevent memory issues

    console.log(`🔍 Found ${attendances.length} attendance records`);

    // Calculate summary statistics
    const summary = {
      totalRecords: attendances.length,
      recentAttendance: attendances.slice(0, 10),
      stats: {
        totalMarked: attendances.length,
        averageAttendance: attendances.length > 0 
          ? attendances.reduce((sum, att) => sum + (att.presents?.length || 0), 0) / attendances.length * 100
          : 0
      }
    };

    res.json({ message: 'Attendance summary retrieved successfully', summary });
  } catch (error) {
    console.error('❌ Get attendance summary error:', error);
    res.status(500).json({ 
      message: 'Failed to get attendance summary: ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function getClassAttendance(req, res) {
  try {
    const { department, semester, shift, date } = req.query

    if (!department || !semester || !shift || !date) {
      return res.status(400).json({ message: 'Department, semester, shift, and date are required' })
    }

    const dateObj = parseISODateOnly(date)
    if (!dateObj) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' })
    }

    console.log('🔍 Get class attendance:', { department, semester, shift, date });

    // Find attendance for the specific date
    const attendance = await PeriodAttendance.findOne({
      department: new RegExp(`^${department}$`, 'i'),
      semester,
      shift,
      date: dateObj
    })

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance found for this class on the specified date' })
    }

    // Get all students for this class
    const students = await Student.find({
      department: new RegExp(`^${department}$`, 'i'),
      semester,
      shift,
      status: 'active'
    })

    console.log(`🔍 Found ${students.length} students for class attendance`);

    // Prepare attendance data with student names
    const attendanceData = {
      date: date,
      department,
      semester,
      shift,
      period: attendance.period,
      subject: attendance.subject,
      totalStudents: students.length,
      absentees: attendance.absentees || [],
      presents: attendance.presents || [],
      markedAt: attendance.createdAt
    }

    res.json({ message: 'Class attendance retrieved successfully', attendance: attendanceData })
  } catch (error) {
    console.error('❌ Get class attendance error:', error);
    res.status(500).json({ 
      message: 'Failed to get class attendance: ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Calculate student attendance statistics
 * @param {string} pin - Student PIN
 * @returns {Object} - Attendance statistics with monthly breakdown
 */
export async function getStudentAttendance(req, res) {
  try {
    const { pin } = req.params
    
    if (!pin) {
      return res.status(400).json({ error: 'Student PIN is required' })
    }
    
    // Find student
    const student = await Student.findOne({ pin, status: 'active' })
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    // Fetch all period attendance records for the student's semester
    const attendanceRecords = await PeriodAttendance.find({
      semester: student.semester,
      department: student.department,
      shift: student.shift
    }).sort({ date: 1, period: 1 })
    
    if (attendanceRecords.length === 0) {
      return res.json({
        overallPercentage: 0,
        totalClasses: 0,
        present: 0,
        absent: 0,
        monthlyBreakdown: []
      })
    }
    
    // Group records by date and calculate daily attendance
    const dailyAttendance = {}
    const monthlyData = {}
    
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0]
      const monthYear = record.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      if (!dailyAttendance[dateStr]) {
        dailyAttendance[dateStr] = {
          date: dateStr,
          totalPeriods: 0,
          presentPeriods: 0,
          monthYear
        }
      }
      
      dailyAttendance[dateStr].totalPeriods++
      
      // Check if student is present in this period
      if (record.presents.includes(pin)) {
        dailyAttendance[dateStr].presentPeriods++
      }
      
      // Initialize monthly data
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          totalDays: 0,
          presentDays: 0
        }
      }
    })
    
    // Calculate daily status and monthly aggregates
    let totalWorkingDays = 0
    let totalPresentDays = 0
    
    Object.values(dailyAttendance).forEach(day => {
      // Apply 4-period rule: present if >= 4 periods
      const isPresent = day.presentPeriods >= 4
      
      if (isPresent) {
        totalPresentDays++
      }
      totalWorkingDays++
      
      // Update monthly data
      monthlyData[day.monthYear].totalDays++
      if (isPresent) {
        monthlyData[day.monthYear].presentDays++
      }
    })
    
    // Calculate overall percentage
    const overallPercentage = totalWorkingDays > 0 
      ? Math.round((totalPresentDays / totalWorkingDays) * 100) 
      : 0
    
    // Generate monthly breakdown
    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      percentage: data.totalDays > 0 
        ? Math.round((data.presentDays / data.totalDays) * 100) 
        : 0,
      totalDays: data.totalDays,
      presentDays: data.presentDays
    })).sort((a, b) => {
      // Sort by month chronologically
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateA - dateB
    })
    
    res.json({
      overallPercentage,
      totalClasses: totalWorkingDays,
      present: totalPresentDays,
      absent: totalWorkingDays - totalPresentDays,
      monthlyBreakdown
    })
    
  } catch (error) {
    console.error('Error calculating student attendance:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Export student attendance to Excel
 * @param {string} pin - Student PIN
 * @returns {Buffer} - Excel file buffer
 */
export async function exportStudentAttendance(req, res) {
  try {
    const { pin } = req.params
    
    if (!pin) {
      return res.status(400).json({ error: 'Student PIN is required' })
    }
    
    // Find student
    const student = await Student.findOne({ pin, status: 'active' })
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    // Fetch all period attendance records for the student's semester
    const attendanceRecords = await PeriodAttendance.find({
      semester: student.semester,
      department: student.department,
      shift: student.shift
    }).sort({ date: 1, period: 1 })
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found' })
    }
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Attendance Report')
    
    // Set up columns
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Present Periods', key: 'presentPeriods', width: 15 },
      { header: 'Total Periods', key: 'totalPeriods', width: 15 },
      { header: 'Day Status', key: 'status', width: 15 }
    ]
    
    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6B8' }
    }
    
    // Process attendance data
    const dailyAttendance = {}
    const monthlyData = {}
    
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0]
      const monthYear = record.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      if (!dailyAttendance[dateStr]) {
        dailyAttendance[dateStr] = {
          date: record.date.toLocaleDateString(),
          totalPeriods: 0,
          presentPeriods: 0,
          monthYear
        }
      }
      
      dailyAttendance[dateStr].totalPeriods++
      
      if (record.presents.includes(pin)) {
        dailyAttendance[dateStr].presentPeriods++
      }
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          totalDays: 0,
          presentDays: 0
        }
      }
    })
    
    // Add daily attendance data
    let totalWorkingDays = 0
    let totalPresentDays = 0
    
    Object.values(dailyAttendance).forEach(day => {
      const isPresent = day.presentPeriods >= 4
      const status = isPresent ? 'Present' : 'Absent'
      
      if (isPresent) {
        totalPresentDays++
      }
      totalWorkingDays++
      
      monthlyData[day.monthYear].totalDays++
      if (isPresent) {
        monthlyData[day.monthYear].presentDays++
      }
      
      worksheet.addRow({
        date: day.date,
        presentPeriods: day.presentPeriods,
        totalPeriods: day.totalPeriods,
        status
      })
    })
    
    // Add summary section
    const summaryStartRow = worksheet.rowCount + 3
    worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY'
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 }
    
    const summaryData = [
      ['Student Name:', student.name],
      ['PIN:', student.pin],
      ['Department:', student.department],
      ['Semester:', student.semester],
      ['Shift:', student.shift],
      [],
      ['Total Working Days:', totalWorkingDays],
      ['Present Days:', totalPresentDays],
      ['Absent Days:', totalWorkingDays - totalPresentDays],
      ['Attendance %:', `${Math.round((totalPresentDays / totalWorkingDays) * 100)}%`]
    ]
    
    summaryData.forEach((row, index) => {
      worksheet.getCell(`A${summaryStartRow + index + 1}`).value = row[0]
      worksheet.getCell(`B${summaryStartRow + index + 1}`).value = row[1]
      if (index >= 6) { // Style the statistics rows
        worksheet.getCell(`A${summaryStartRow + index + 1}`).font = { bold: true }
        worksheet.getCell(`B${summaryStartRow + index + 1}`).font = { bold: true }
      }
    })
    
    // Add monthly breakdown
    const monthlyStartRow = summaryStartRow + summaryData.length + 2
    worksheet.getCell(`A${monthlyStartRow}`).value = 'MONTHLY BREAKDOWN'
    worksheet.getCell(`A${monthlyStartRow}`).font = { bold: true, size: 14 }
    
    // Monthly breakdown headers
    worksheet.getCell(`A${monthlyStartRow + 1}`).value = 'Month'
    worksheet.getCell(`B${monthlyStartRow + 1}`).value = 'Total Days'
    worksheet.getCell(`C${monthlyStartRow + 1}`).value = 'Present Days'
    worksheet.getCell(`D${monthlyStartRow + 1}`).value = 'Attendance %'
    
    worksheet.getRow(monthlyStartRow + 1).font = { bold: true }
    
    // Monthly breakdown data
    Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([month, data], index) => {
        const row = monthlyStartRow + 2 + index
        const percentage = Math.round((data.presentDays / data.totalDays) * 100)
        
        worksheet.getCell(`A${row}`).value = month
        worksheet.getCell(`B${row}`).value = data.totalDays
        worksheet.getCell(`C${row}`).value = data.presentDays
        worksheet.getCell(`D${row}`).value = `${percentage}%`
      })
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${student.pin}_${Date.now()}.xlsx`
    )
    
    // Send Excel file
    await workbook.xlsx.write(res)
    res.end()
    
  } catch (error) {
    console.error('Error exporting student attendance:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

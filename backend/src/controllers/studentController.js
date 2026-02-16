import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'

export async function createStudent(req, res) {
  try {
    const { pin, name, department, year, semester, shift } = req.body || {}

    // Validate required fields
    if (!pin || !name || !department || !year || !semester || !shift) {
      return res.status(400).json({ message: 'All required fields must be provided' })
    }

    // Validate PIN format
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be a 4-6 digit number' })
    }

    // Validate department (only CME allowed)
    if (department !== 'CME') {
      return res.status(400).json({ message: 'Only CME department is allowed' })
    }

    // Validate year format (should be 1st, 2nd, or 3rd year)
    if (!['1st year', '2nd year', '3rd year'].includes(year)) {
      return res.status(400).json({ message: 'Year must be 1st year, 2nd year, or 3rd year' })
    }

    // Validate shift enum
    if (!['1st shift', '2nd shift'].includes(shift)) {
      return res.status(400).json({ message: 'Shift must be either "1st shift" or "2nd shift"' })
    }

    const existing = await Student.findOne({ pin: String(pin).trim() })
    if (existing) {
      return res.status(409).json({ message: 'PIN already exists' })
    }

    const student = await Student.create({ 
      pin: String(pin).trim(), 
      name, 
      department, 
      year, 
      semester, 
      shift, 
      status: 'active'
    })
    
    console.log('✅ Student created successfully:', { pin, name, department, year, semester, shift })
    return res.status(201).json({ student })
  } catch (error) {
    console.error('Create student error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getStudents(req, res) {
  try {
    const { department, semester, shift, section } = req.query || {}
    
    console.log('🔍 Get Students API called with params:', { department, semester, shift, section })

    const filter = { status: 'active' }
    
    // Handle department case-insensitive
    if (department) filter.department = new RegExp(`^${department}$`, 'i')
    
    // Handle semester - try multiple formats
    if (semester) {
      // Try exact match first
      filter.semester = semester
    }
    
    // Handle shift - check both shift and section parameters (frontend sends shift in section)
    const shiftValue = shift || section // Frontend sends shift in 'section' parameter
    if (shiftValue) filter.shift = shiftValue

    console.log('🔍 Database filter:', filter)

    // First, let's see what's actually in the database
    const allStudents = await Student.find({ status: 'active' })
    console.log('🔍 All active students in DB:', allStudents.length)
    if (allStudents.length > 0) {
      console.log('🔍 Sample student data:', {
        department: allStudents[0].department,
        semester: allStudents[0].semester,
        shift: allStudents[0].shift,
        pin: allStudents[0].pin
      })
    }

    const students = await Student.find(filter).sort({ pin: 1 }) // Load all matched students
    console.log(`🔍 Found ${students.length} students`)
    
    if (students.length > 0) {
      console.log('🔍 Sample student:', students[0])
      console.log('🔍 Available semesters in database:', [...new Set(students.map(s => s.semester))])
      console.log('🔍 Available shifts in database:', [...new Set(students.map(s => s.shift))])
    }

    return res.json({ students })
  } catch (error) {
    console.error('❌ Get Students Error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export async function deleteStudent(req, res) {
  try {
    const { pin } = req.params

    // Validate PIN format
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' })
    }

    // Find and delete student
    const student = await Student.findOneAndDelete({ pin })
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    console.log(`✅ Student deleted: ${student.pin} - ${student.name}`)
    return res.json({ 
      message: 'Student deleted successfully',
      student: {
        pin: student.pin,
        name: student.name
      }
    })
  } catch (error) {
    console.error('Delete student error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getStudentAttendance(req, res) {
  try {
    const { pin } = req.params
    const { department, semester, shift, startDate, endDate } = req.query

    // Validate PIN format
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'Invalid PIN format' })
    }

    // Find student
    const student = await Student.findOne({ pin, status: 'active' })
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Build query for attendance
    const query = {
      $or: [
        { absentees: pin },
        { presents: pin }
      ]
    }

    // Add filters if provided
    if (department) query.department = department
    if (semester) query.semester = semester
    if (shift) query.shift = shift
    
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ date: 1, period: 1 })

    // Process attendance data
    const attendanceData = processAttendanceData(attendanceRecords, pin)

    res.status(200).json({
      message: 'Student attendance retrieved successfully',
      student: {
        pin: student.pin,
        shortPin: student.shortPin,
        name: student.name,
        department: student.department,
        year: student.year,
        semester: student.semester,
        shift: student.shift
      },
      attendance: attendanceData
    })
  } catch (error) {
    console.error('Student attendance error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getMonthlyReport(req, res) {
  try {
    const { pin } = req.params
    const { month, year, department, semester, shift } = req.query

    // Validate PIN format
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'Invalid PIN format' })
    }

    // Find student
    const student = await Student.findOne({ pin, status: 'active' })
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Calculate date range for the month
    const targetMonth = parseInt(month) || new Date().getMonth() + 1
    const targetYear = parseInt(year) || new Date().getFullYear()
    
    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0)

    // Build query
    const query = {
      date: { $gte: startDate, $lte: endDate },
      $or: [
        { absentees: pin },
        { presents: pin }
      ]
    }

    if (department) query.department = department
    if (semester) query.semester = semester
    if (shift) query.shift = shift

    const attendanceRecords = await Attendance.find(query)
      .sort({ date: 1, period: 1 })

    // Process monthly data
    const monthlyData = processMonthlyData(attendanceRecords, pin, targetMonth, targetYear)

    res.status(200).json({
      message: 'Monthly report retrieved successfully',
      student: {
        pin: student.pin,
        name: student.name,
        department: student.department,
        semester: student.semester,
        shift: student.shift
      },
      monthlyData
    })
  } catch (error) {
    console.error('Monthly report error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Helper function to process attendance data
const processAttendanceData = (records, pin) => {
  const dayWiseAttendance = {}
  let totalWorkingDays = 0
  let presentDays = 0
  let absentDays = 0

  records.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0]
    
    if (!dayWiseAttendance[dateStr]) {
      dayWiseAttendance[dateStr] = {
        date: dateStr,
        periods: [],
        presentPeriods: 0,
        absentPeriods: 0
      }
      totalWorkingDays++
    }

    const isPresent = record.presents.includes(pin)
    dayWiseAttendance[dateStr].periods.push({
      period: record.period,
      subject: record.subject,
      status: isPresent ? 'present' : 'absent'
    })

    if (isPresent) {
      dayWiseAttendance[dateStr].presentPeriods++
    } else {
      dayWiseAttendance[dateStr].absentPeriods++
    }
  })

  // Calculate day-wise attendance based on 5-period rule
  Object.keys(dayWiseAttendance).forEach(date => {
    const dayData = dayWiseAttendance[date]
    if (dayData.presentPeriods >= 5) {
      presentDays++
      dayData.dayStatus = 'present'
    } else {
      absentDays++
      dayData.dayStatus = 'absent'
    }
  })

  const attendancePercentage = totalWorkingDays > 0 ? 
    Math.round((presentDays / totalWorkingDays) * 100) : 0

  return {
    summary: {
      totalWorkingDays,
      presentDays,
      absentDays,
      attendancePercentage
    },
    dayWiseAttendance: Object.values(dayWiseAttendance)
  }
}

// Helper function to process monthly data
const processMonthlyData = (records, pin, month, year) => {
  const monthData = []
  const daysInMonth = new Date(year, month, 0).getDate()

  // Initialize all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    monthData.push({
      date: dateStr,
      dayOfWeek: new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' }),
      periods: [],
      presentPeriods: 0,
      absentPeriods: 0,
      dayStatus: 'holiday' // Default to holiday
    })
  }

  // Process attendance records
  records.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0]
    const dayIndex = monthData.findIndex(d => d.date === dateStr)
    
    if (dayIndex !== -1) {
      const isPresent = record.presents.includes(pin)
      monthData[dayIndex].periods.push({
        period: record.period,
        subject: record.subject,
        status: isPresent ? 'present' : 'absent'
      })

      if (isPresent) {
        monthData[dayIndex].presentPeriods++
      } else {
        monthData[dayIndex].absentPeriods++
      }

      // Update day status if there are classes
      if (monthData[dayIndex].periods.length > 0) {
        monthData[dayIndex].dayStatus = 
          monthData[dayIndex].presentPeriods >= 5 ? 'present' : 'absent'
      }
    }
  })

  // Calculate monthly summary
  const workingDays = monthData.filter(d => d.periods.length > 0).length
  const presentDays = monthData.filter(d => d.dayStatus === 'present').length
  const absentDays = monthData.filter(d => d.dayStatus === 'absent').length
  const attendancePercentage = workingDays > 0 ? 
    Math.round((presentDays / workingDays) * 100) : 0

  return {
    summary: {
      month,
      year,
      workingDays,
      presentDays,
      absentDays,
      attendancePercentage
    },
    dailyData: monthData
  }
}

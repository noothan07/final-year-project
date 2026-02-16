import Student from '../models/Student.js'
import PeriodAttendance from '../models/Attendance.js'
import { parseISODateOnly } from '../utils/dates.js'
import { parseRollList, uniq } from '../utils/rollParsing.js'

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

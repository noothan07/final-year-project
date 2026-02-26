import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { getMonthRange, parseISODateOnly } from '../utils/dates.js'
import { SUBJECTS } from '../utils/timetableGenerator.js'

export async function getSubjectWiseSummary(req, res) {
  try {
    const { department, semester, shift, date } = req.query || {}

    if (!department || !semester || !shift) {
      return res.status(400).json({ message: 'department, semester, and shift are required' })
    }

    // Get students for this class
    const students = await Student.find({ 
      department, 
      semester, 
      shift,
      status: 'active' 
    }).lean()
    
    const totalStudents = students.length
    console.log(`🔍 Subject-wise Dashboard: Found ${totalStudents} students for ${department} ${semester} ${shift}`)

    // Get subjects for this semester
    const subjects = SUBJECTS[semester] || []
    
    const dateObj = date ? parseISODateOnly(date) : null
    const now = new Date()
    const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)

    const subjectWiseData = []

    for (const subject of subjects) {
      let todaysPresent = 0
      let todaysTotal = 0
      let monthlyAverage = 0

      // Today's attendance for this subject
      if (dateObj && totalStudents > 0) {
        const pins = students.map((s) => s.pin)
        const todays = await Attendance.find({ 
          department,
          semester,
          shift,
          subject, 
          date: dateObj 
        }).lean()
        
        for (const record of todays) {
          const markedStudents = [...(record.presents || []), ...(record.absentees || [])]
          const markedInClass = markedStudents.filter(pin => pins.includes(pin))
          
          todaysTotal += markedInClass.length
          todaysPresent += (record.presents || []).filter(pin => pins.includes(pin)).length
        }
      }

      // Monthly average for this subject
      if (range && totalStudents > 0) {
        const pins = students.map((s) => s.pin)
        const monthly = await Attendance.find({
          department,
          semester,
          shift,
          subject,
          date: { $gte: range.start, $lt: range.end },
        }).lean()

        const workingDaySet = new Set(monthly.map((r) => new Date(r.date).toISOString().slice(0, 10)))
        const workingDays = workingDaySet.size

        if (workingDays > 0) {
          const presentByPin = new Map()
          for (const s of students) presentByPin.set(s.pin, 0)
          
          for (const record of monthly) {
            const presentsInClass = (record.presents || []).filter(pin => pins.includes(pin))
            for (const pin of presentsInClass) {
              presentByPin.set(pin, (presentByPin.get(pin) || 0) + 1)
            }
          }

          let sum = 0
          for (const s of students) {
            const present = presentByPin.get(s.pin) || 0
            sum += (present / workingDays) * 100
          }

          monthlyAverage = Number((sum / totalStudents).toFixed(2))
        }
      }

      subjectWiseData.push({
        subject,
        totalStudents,
        todaysAttendance: { totalMarked: todaysTotal, present: todaysPresent },
        monthlyAverage,
      })
    }

    return res.json({
      totalStudents,
      subjectWiseData,
    })
  } catch (error) {
    console.error('Subject-wise dashboard summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getSummary(req, res) {
  try {
    const { department, year, semester, shift, subject, date } = req.query || {}

    if (!department || !semester || !shift || !subject) {
      return res.status(400).json({ message: 'department, semester, shift, and subject are required' })
    }

    // Get students for this class - use semester field instead of year
    const students = await Student.find({ 
      department, 
      semester, 
      shift,
      status: 'active' 
    }).lean()
    
    const totalStudents = students.length
    console.log(`🔍 Dashboard: Found ${totalStudents} students for ${department} ${semester} ${shift} ${subject}`)

    const dateObj = date ? parseISODateOnly(date) : null

    let todaysPresent = 0
    let todaysTotal = 0

    if (dateObj && totalStudents > 0) {
      const pins = students.map((s) => s.pin)
      const todays = await Attendance.find({ 
        department,
        semester,
        shift,
        subject, 
        date: dateObj 
      }).lean()
      
      // Check if any attendance records exist for this subject on this date
      if (todays.length === 0) {
        return res.status(404).json({ 
          message: `No attendance records found for subject "${subject}" on ${dateObj.toISOString().slice(0, 10)}`
        })
      }
      
      // Calculate unique students who attended today (not per period)
      const uniquePresentStudents = new Set()
      const uniqueMarkedStudents = new Set()
      
      // Use the LATEST period's data for today's attendance card
      const latestPeriodRecord = todays.reduce((latest, current) => {
        return (!latest || current.period > latest.period) ? current : latest
      }, null)
      
      console.log(`🔍 Found ${todays.length} attendance records for ${subject} on ${dateObj.toISOString().slice(0, 10)}`)
      console.log(`🔍 Latest period record:`, latestPeriodRecord)
      
      if (latestPeriodRecord) {
        // Add all presents to unique set
        const presentsInClass = (latestPeriodRecord.presents || []).filter(pin => pins.includes(pin))
        presentsInClass.forEach(pin => uniquePresentStudents.add(pin))
        
        // Add all marked students (present + absent) to unique set
        const markedStudents = [...(latestPeriodRecord.presents || []), ...(latestPeriodRecord.absentees || [])]
        const markedInClass = markedStudents.filter(pin => pins.includes(pin))
        markedInClass.forEach(pin => uniqueMarkedStudents.add(pin))
        
        console.log(`🔍 Unique present students: ${uniquePresentStudents.size}`)
        console.log(`🔍 Unique marked students: ${uniqueMarkedStudents.size}`)
      }
      
      todaysTotal = uniqueMarkedStudents.size
      todaysPresent = uniquePresentStudents.size
    }

    // Use selected date's month instead of current month
    const selectedDate = date ? new Date(date) : new Date()
    const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)

    let monthlyAverage = 0

    if (range && totalStudents > 0) {
      const pins = students.map((s) => s.pin)
      const monthly = await Attendance.find({
        department,
        semester,
        shift,
        subject,
        date: { $gte: range.start, $lt: range.end },
      }).lean()

      // Group attendance by date to calculate unique students per day
      const attendanceByDate = new Map()
      
      for (const record of monthly) {
        const dateStr = new Date(record.date).toISOString().slice(0, 10)
        
        if (!attendanceByDate.has(dateStr)) {
          attendanceByDate.set(dateStr, {
            presents: new Set(),
            marked: new Set()
          })
        }
        
        const dayAttendance = attendanceByDate.get(dateStr)
        
        // Add presents to unique set for this date
        const presentsInClass = (record.presents || []).filter(pin => pins.includes(pin))
        presentsInClass.forEach(pin => dayAttendance.presents.add(pin))
        
        // Add all marked students to unique set for this date
        const markedStudents = [...(record.presents || []), ...(record.absentees || [])]
        const markedInClass = markedStudents.filter(pin => pins.includes(pin))
        markedInClass.forEach(pin => dayAttendance.marked.add(pin))
      }

      const workingDays = attendanceByDate.size

      if (workingDays > 0) {
        const presentByPin = new Map()
        for (const s of students) presentByPin.set(s.pin, 0)
        
        // Calculate presents per student across all days
        for (const [dateStr, dayAttendance] of attendanceByDate) {
          for (const pin of dayAttendance.presents) {
            presentByPin.set(pin, (presentByPin.get(pin) || 0) + 1)
          }
        }

        let sum = 0
        for (const s of students) {
          const present = presentByPin.get(s.pin) || 0
          sum += (present / workingDays) * 100
        }

        monthlyAverage = Number((sum / totalStudents).toFixed(2))
      }
    }

    return res.json({
      totalStudents,
      todaysAttendance: { totalMarked: todaysTotal, present: todaysPresent },
      monthlyAverage,
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

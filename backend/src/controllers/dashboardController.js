import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { getMonthRange, parseISODateOnly } from '../utils/dates.js'
import { SUBJECTS } from '../utils/timetableGenerator.js'

// Chart API functions
export async function getMonthlySummary(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get last 6 months of attendance data
    const monthlyData = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      const range = getMonthRange(monthStr)
      
      const pins = students.map((s) => s.pin)
      const monthly = await Attendance.find({
        department,
        semester,
        shift,
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
      let monthlyAverage = 0

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

      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        attendance: monthlyAverage
      })
    }

    return res.json(monthlyData)
  } catch (error) {
    console.error('Monthly summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getWeeklySummary(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get last 7 working days of attendance data
    const weeklyData = []
    const now = new Date()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Skip weekends (Saturday and Sunday)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue
      }
      
      const dateStr = date.toISOString().slice(0, 10)
      const pins = students.map((s) => s.pin)
      
      const daily = await Attendance.find({
        department,
        semester,
        shift,
        date: parseISODateOnly(dateStr)
      }).lean()

      // Calculate unique attendance for this day
      const uniquePresentStudents = new Set()
      const uniqueMarkedStudents = new Set()
      
      for (const record of daily) {
        // Add presents to unique set
        const presentsInClass = (record.presents || []).filter(pin => pins.includes(pin))
        presentsInClass.forEach(pin => uniquePresentStudents.add(pin))
        
        // Add all marked students to unique set
        const markedStudents = [...(record.presents || []), ...(record.absentees || [])]
        const markedInClass = markedStudents.filter(pin => pins.includes(pin))
        markedInClass.forEach(pin => uniqueMarkedStudents.add(pin))
      }
      
      const attendancePercentage = uniqueMarkedStudents.size > 0 
        ? Number(((uniquePresentStudents.size / uniqueMarkedStudents.size) * 100).toFixed(2))
        : 0

      weeklyData.push({
        day: dayNames[dayOfWeek],
        attendance: attendancePercentage
      })
    }

    return res.json(weeklyData)
  } catch (error) {
    console.error('Weekly summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getTodaySummary(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json({ present: 0, absent: 0 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const pins = students.map((s) => s.pin)
    
    const todays = await Attendance.find({
      department,
      semester,
      shift,
      date: parseISODateOnly(today)
    }).lean()

    // Calculate unique attendance for today
    const uniquePresentStudents = new Set()
    const uniqueMarkedStudents = new Set()
    
    for (const record of todays) {
      // Add presents to unique set
      const presentsInClass = (record.presents || []).filter(pin => pins.includes(pin))
      presentsInClass.forEach(pin => uniquePresentStudents.add(pin))
      
      // Add all marked students to unique set
      const markedStudents = [...(record.presents || []), ...(record.absentees || [])]
      const markedInClass = markedStudents.filter(pin => pins.includes(pin))
      markedInClass.forEach(pin => uniqueMarkedStudents.add(pin))
    }
    
    const presentCount = uniquePresentStudents.size
    const absentCount = uniqueMarkedStudents.size - presentCount

    return res.json({ present: presentCount, absent: absentCount })
  } catch (error) {
    console.error('Today summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getSubjectSummary(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get subjects for this semester
    const subjects = SUBJECTS[semester] || []
    const subjectData = []
    
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)

    for (const subject of subjects) {
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
      let monthlyAverage = 0

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

      subjectData.push({
        subject,
        attendance: monthlyAverage
      })
    }

    return res.json(subjectData)
  } catch (error) {
    console.error('Subject summary error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getAttendanceDistribution(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get current month attendance data
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)
    
    const pins = students.map((s) => s.pin)
    const monthly = await Attendance.find({
      department,
      semester,
      shift,
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
    const studentAttendancePercentages = []

    if (workingDays > 0) {
      // Calculate attendance percentage for each student
      for (const student of students) {
        let presentDays = 0
        
        for (const [dateStr, dayAttendance] of attendanceByDate) {
          if (dayAttendance.presents.has(student.pin)) {
            presentDays++
          }
        }
        
        const attendancePercentage = (presentDays / workingDays) * 100
        studentAttendancePercentages.push(attendancePercentage)
      }
    }

    // Distribute students into ranges
    const distribution = [
      { name: '90-100%', value: 0 },
      { name: '75-89%', value: 0 },
      { name: '60-74%', value: 0 },
      { name: 'Below 60%', value: 0 }
    ]

    for (const percentage of studentAttendancePercentages) {
      if (percentage >= 90) {
        distribution[0].value++
      } else if (percentage >= 75) {
        distribution[1].value++
      } else if (percentage >= 60) {
        distribution[2].value++
      } else {
        distribution[3].value++
      }
    }

    return res.json(distribution)
  } catch (error) {
    console.error('Attendance distribution error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getLowAttendanceStudents(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get current month attendance data
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)
    
    const pins = students.map((s) => s.pin)
    const monthly = await Attendance.find({
      department,
      semester,
      shift,
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
    const studentAttendanceData = []

    if (workingDays > 0) {
      // Calculate attendance percentage for each student
      for (const student of students) {
        let presentDays = 0
        
        for (const [dateStr, dayAttendance] of attendanceByDate) {
          if (dayAttendance.presents.has(student.pin)) {
            presentDays++
          }
        }
        
        const attendancePercentage = (presentDays / workingDays) * 100
        studentAttendanceData.push({
          student: student.name || student.pin,
          attendance: Number(attendancePercentage.toFixed(2))
        })
      }
    }

    // Sort by attendance percentage (ascending) and take lowest 5
    studentAttendanceData.sort((a, b) => a.attendance - b.attendance)
    const lowAttendanceStudents = studentAttendanceData.slice(0, 5)

    return res.json(lowAttendanceStudents)
  } catch (error) {
    console.error('Low attendance students error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function getPeriodAnalysis(req, res) {
  try {
    const { department, semester, shift } = req.query || {}

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
    if (totalStudents === 0) {
      return res.json([])
    }

    // Get last 5 working days of attendance data
    const periodData = []
    const now = new Date()
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Skip weekends
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue
      }
      
      const dateStr = date.toISOString().slice(0, 10)
      const pins = students.map((s) => s.pin)
      
      const daily = await Attendance.find({
        department,
        semester,
        shift,
        date: parseISODateOnly(dateStr)
      }).lean()

      // Calculate attendance by period for this day
      const periodAttendance = {
        day: dayNames[dayOfWeek - 1], // Adjust for Monday=1
        period1: 0,
        period2: 0,
        period3: 0,
        period4: 0,
        period5: 0,
        period6: 0,
        period7: 0
      }
      
      // Group records by period
      const recordsByPeriod = new Map()
      for (const record of daily) {
        const period = record.period || 1
        if (!recordsByPeriod.has(period)) {
          recordsByPeriod.set(period, [])
        }
        recordsByPeriod.get(period).push(record)
      }
      
      // Calculate attendance percentage for each period
      for (let period = 1; period <= 7; period++) {
        const periodRecords = recordsByPeriod.get(period) || []
        
        if (periodRecords.length > 0) {
          // Use the latest record for this period
          const latestRecord = periodRecords.reduce((latest, current) => {
            return (!latest || current.createdAt > latest.createdAt) ? current : latest
          }, null)
          
          if (latestRecord) {
            const presentsInClass = (latestRecord.presents || []).filter(pin => pins.includes(pin))
            const markedStudents = [...(latestRecord.presents || []), ...(latestRecord.absentees || [])]
            const markedInClass = markedStudents.filter(pin => pins.includes(pin))
            
            const attendancePercentage = markedInClass.length > 0 
              ? Number(((presentsInClass.length / markedInClass.length) * 100).toFixed(2))
              : 0
              
            periodAttendance[`period${period}`] = attendancePercentage
          }
        }
      }
      
      periodData.push(periodAttendance)
    }

    return res.json(periodData)
  } catch (error) {
    console.error('Period analysis error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

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
      
      // Use LATEST period's data for today's attendance card
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

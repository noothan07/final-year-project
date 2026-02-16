import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { getMonthRange, parseISODateOnly } from '../utils/dates.js'

export async function getSummary(req, res) {
  try {
    const { department, year, semester, shift, subject, date } = req.query || {}

    if (!department || !year || !semester || !shift) {
      return res.status(400).json({ message: 'department, year, semester, shift are required' })
    }

    // Get students for this class
    const students = await Student.find({ 
      department, 
      year, 
      semester, 
      shift,
      status: 'active' 
    }).lean()
    
    const totalStudents = students.length
    console.log(`🔍 Dashboard: Found ${totalStudents} students for ${department} ${year} ${semester} ${shift}`)

    const dateObj = date ? parseISODateOnly(date) : null

    let todaysPresent = 0
    let todaysTotal = 0

    if (dateObj && totalStudents > 0) {
      const pins = students.map((s) => s.pin)
      const todays = await Attendance.find({ 
        pin: { $in: pins }, 
        subject, 
        date: dateObj 
      }).lean()
      todaysTotal = todays.length
      todaysPresent = todays.filter((r) => r.status === 'Present').length
    }

    const now = new Date()
    const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const range = getMonthRange(monthStr)

    let monthlyAverage = 0

    if (range && totalStudents > 0) {
      const pins = students.map((s) => s.pin)
      const monthly = await Attendance.find({
        pin: { $in: pins },
        subject,
        date: { $gte: range.start, $lt: range.end },
      }).lean()

      const workingDaySet = new Set(monthly.map((r) => new Date(r.date).toISOString().slice(0, 10)))
      const workingDays = workingDaySet.size

      if (workingDays > 0) {
        const presentByPin = new Map()
        for (const s of students) presentByPin.set(s.pin, 0)
        for (const r of monthly) {
          if (r.status === 'Present') presentByPin.set(r.pin, (presentByPin.get(r.pin) || 0) + 1)
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

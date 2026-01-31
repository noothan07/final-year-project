import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { getMonthRange, parseISODateOnly } from '../utils/dates.js'

export async function getSummary(req, res) {
  const { department, year, section, subject, date } = req.query || {}

  if (!department || !year || !section || !subject) {
    return res.status(400).json({ message: 'department, year, section, subject are required' })
  }

  // Mock mode: return fake summary data
  if (process.env.MOCK_MODE === 'true') {
    return res.json({
      totalStudents: 5,
      todaysAttendance: { totalMarked: 5, present: 4 },
      monthlyAverage: 85.5
    })
  }

  const students = await Student.find({ department, year, section }).lean()
  const totalStudents = students.length

  const dateObj = date ? parseISODateOnly(date) : null

  let todaysPresent = 0
  let todaysTotal = 0

  if (dateObj && totalStudents > 0) {
    const rolls = students.map((s) => s.rollNo)
    const todays = await Attendance.find({ rollNo: { $in: rolls }, subject, date: dateObj }).lean()
    todaysTotal = todays.length
    todaysPresent = todays.filter((r) => r.status === 'Present').length
  }

  const now = new Date()
  const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const range = getMonthRange(monthStr)

  let monthlyAverage = 0

  if (range && totalStudents > 0) {
    const rolls = students.map((s) => s.rollNo)
    const monthly = await Attendance.find({
      rollNo: { $in: rolls },
      subject,
      date: { $gte: range.start, $lt: range.end },
    }).lean()

    const workingDaySet = new Set(monthly.map((r) => new Date(r.date).toISOString().slice(0, 10)))
    const workingDays = workingDaySet.size

    if (workingDays > 0) {
      const presentByRoll = new Map()
      for (const s of students) presentByRoll.set(s.rollNo, 0)
      for (const r of monthly) {
        if (r.status === 'Present') presentByRoll.set(r.rollNo, (presentByRoll.get(r.rollNo) || 0) + 1)
      }

      let sum = 0
      for (const s of students) {
        const present = presentByRoll.get(s.rollNo) || 0
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
}

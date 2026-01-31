import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { parseISODateOnly } from '../utils/dates.js'
import { parseRollList, uniq } from '../utils/rollParsing.js'

export async function markAttendance(req, res) {
  const {
    department,
    year,
    section,
    subject,
    date,
    absentees,
    presents,
  } = req.body || {}

  if (!department || !year || !section || !subject || !date) {
    return res.status(400).json({ message: 'department, year, section, subject, date are required' })
  }

  // Mock mode: return fake attendance data
  if (process.env.MOCK_MODE === 'true') {
    return res.json({
      message: 'Attendance marked successfully (mock)',
      attendance: [
        { rollNo: '101', status: 'Present' },
        { rollNo: '102', status: 'Present' },
        { rollNo: '103', status: 'Absent' },
        { rollNo: '104', status: 'Present' },
        { rollNo: '105', status: 'Present' }
      ]
    })
  }

  const dateObj = parseISODateOnly(date)
  if (!dateObj) {
    return res.status(400).json({ message: 'Invalid date. Use YYYY-MM-DD.' })
  }

  const absList = uniq(parseRollList(absentees))
  const presList = uniq(parseRollList(presents))

  if (absList.length > 0 && presList.length > 0) {
    return res.status(400).json({ message: 'Enter only one list: absentees OR presents' })
  }

  const students = await Student.find({ department, year, section }).sort({ rollNo: 1 })
  if (students.length === 0) {
    return res.status(404).json({ message: 'No students found for selected class' })
  }

  const allRolls = students.map((s) => s.rollNo)

  const already = await Attendance.findOne({
    rollNo: { $in: allRolls },
    subject,
    date: dateObj,
  }).lean()

  if (already) {
    return res.status(409).json({ message: 'Attendance already marked for this class, date and subject' })
  }

  let presentSet
  let absentSet

  if (absList.length > 0) {
    absentSet = new Set(absList)
    presentSet = new Set(allRolls.filter((r) => !absentSet.has(r)))
  } else if (presList.length > 0) {
    presentSet = new Set(presList)
    absentSet = new Set(allRolls.filter((r) => !presentSet.has(r)))
  } else {
    presentSet = new Set(allRolls)
    absentSet = new Set([])
  }

  const unknown = []
  for (const r of presentSet) if (!allRolls.includes(r)) unknown.push(r)
  for (const r of absentSet) if (!allRolls.includes(r)) unknown.push(r)

  if (unknown.length > 0) {
    return res.status(400).json({ message: `Unknown roll numbers: ${unknown.join(', ')}` })
  }

  const docs = allRolls.map((rollNo) => ({
    rollNo,
    date: dateObj,
    subject,
    status: presentSet.has(rollNo) ? 'Present' : 'Absent',
  }))

  await Attendance.insertMany(docs, { ordered: true })

  const presentCount = docs.filter((d) => d.status === 'Present').length
  const absentCount = docs.length - presentCount

  return res.status(201).json({
    message: 'Attendance marked',
    summary: { total: docs.length, present: presentCount, absent: absentCount },
  })
}

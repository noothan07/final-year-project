import ExcelJS from 'exceljs'

import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import { getMonthRange } from '../utils/dates.js'

async function buildMonthlySummary({ department, year, section, subject, month }) {
  // Mock mode: return fake summary data
  if (process.env.MOCK_MODE === 'true') {
    return [
      { rollNo: '101', name: 'Alice Johnson', workingDays: 20, present: 18, absent: 2, percentage: 90 },
      { rollNo: '102', name: 'Bob Smith', workingDays: 20, present: 17, absent: 3, percentage: 85 },
      { rollNo: '103', name: 'Charlie Brown', workingDays: 20, present: 16, absent: 4, percentage: 80 },
      { rollNo: '104', name: 'Diana Prince', workingDays: 20, present: 19, absent: 1, percentage: 95 },
      { rollNo: '105', name: 'Edward Norton', workingDays: 20, present: 15, absent: 5, percentage: 75 }
    ]
  }

  const range = getMonthRange(month)
  if (!range) {
    const err = new Error('Invalid month. Use YYYY-MM.')
    err.status = 400
    throw err
  }

  const students = await Student.find({ department, year, section }).sort({ rollNo: 1 }).lean()
  if (students.length === 0) {
    const err = new Error('No students found for selected class')
    err.status = 404
    throw err
  }

  const rolls = students.map((s) => s.rollNo)

  const records = await Attendance.find({
    rollNo: { $in: rolls },
    subject,
    date: { $gte: range.start, $lt: range.end },
  }).lean()

  const workingDaySet = new Set(records.map((r) => new Date(r.date).toISOString().slice(0, 10)))
  const workingDays = workingDaySet.size

  const byRoll = new Map()
  for (const rollNo of rolls) {
    byRoll.set(rollNo, { present: 0, absent: 0 })
  }

  for (const r of records) {
    const entry = byRoll.get(r.rollNo)
    if (!entry) continue
    if (r.status === 'Present') entry.present += 1
    if (r.status === 'Absent') entry.absent += 1
  }

  const rows = students.map((s) => {
    const { present, absent } = byRoll.get(s.rollNo) || { present: 0, absent: 0 }
    const total = workingDays
    const percentage = total > 0 ? (present / total) * 100 : 0

    return {
      rollNo: s.rollNo,
      name: s.name,
      workingDays: total,
      present,
      absent,
      percentage: Number(percentage.toFixed(2)),
    }
  })

  return { rows, workingDays }
}

export async function getMonthlySummary(req, res) {
  try {
    const { department, year, section, subject, month } = req.query || {}
    if (!department || !year || !section || !subject || !month) {
      return res
        .status(400)
        .json({ message: 'department, year, section, subject, month are required' })
    }

    const { rows, workingDays } = await buildMonthlySummary({ department, year, section, subject, month })
    return res.json({ workingDays, students: rows })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ message: err.message || 'Failed to build monthly summary' })
  }
}

export async function exportMonthlyExcel(req, res) {
  try {
    const { department, year, section, subject, month } = req.query || {}
    if (!department || !year || !section || !subject || !month) {
      return res
        .status(400)
        .json({ message: 'department, year, section, subject, month are required' })
    }

    const { rows } = await buildMonthlySummary({ department, year, section, subject, month })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Monthly Report')

    sheet.columns = [
      { header: 'Roll No', key: 'rollNo', width: 14 },
      { header: 'Name', key: 'name', width: 26 },
      { header: 'Working Days', key: 'workingDays', width: 14 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ]

    for (const r of rows) sheet.addRow(r)

    sheet.getRow(1).font = { bold: true }

    const filename = `attendance_${department}_${year}_${section}_${subject}_${month}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ message: err.message || 'Failed to export report' })
  }
}

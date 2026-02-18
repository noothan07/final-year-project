import ExcelJS from 'exceljs'

import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'

async function buildMonthlySummary({ department, semester, shift, subject, month }) {
  const monthDate = new Date(month + '-01')
  if (isNaN(monthDate.getTime())) {
    const err = new Error('Invalid month format. Use YYYY-MM.')
    err.status = 400
    throw err
  }

  const year = monthDate.getFullYear()
  const monthIndex = monthDate.getMonth()
  
  const startDate = new Date(year, monthIndex, 1)
  const endDate = new Date(year, monthIndex + 1, 1)

  const students = await Student.find({ 
    department, 
    semester, 
    shift,
    status: 'active'
  }).sort({ pin: 1 }).lean()

  if (students.length === 0) {
    const err = new Error('No students found for selected class')
    err.status = 404
    throw err
  }

  const attendanceRecords = await Attendance.find({
    department,
    semester,
    shift,
    subject,
    date: { $gte: startDate, $lt: endDate }
  }).lean()

  const uniqueDates = [...new Set(attendanceRecords.map(r => 
    new Date(r.date).toISOString().slice(0, 10)
  ))].sort()
  
  const workingDays = uniqueDates.length

  const studentStats = new Map()
  
  students.forEach(student => {
    studentStats.set(student.pin, {
      pin: student.pin,
      name: student.name,
      presentDays: 0,
      absentDays: 0,
      dailyPeriods: new Map()
    })
  })

  attendanceRecords.forEach(record => {
    const dateStr = new Date(record.date).toISOString().slice(0, 10)
    const period = record.period
    
    record.absentees.forEach(pin => {
      const student = studentStats.get(pin)
      if (student) {
        if (!student.dailyPeriods.has(dateStr)) {
          student.dailyPeriods.set(dateStr, { present: 0, absent: 0 })
        }
        student.dailyPeriods.get(dateStr).absent++
      }
    })

    record.presents.forEach(pin => {
      const student = studentStats.get(pin)
      if (student) {
        if (!student.dailyPeriods.has(dateStr)) {
          student.dailyPeriods.set(dateStr, { present: 0, absent: 0 })
        }
        student.dailyPeriods.get(dateStr).present++
      }
    })
  })

  studentStats.forEach(student => {
    student.dailyPeriods.forEach((periods, dateStr) => {
      // If student is present in at least 1 period for the subject, count as present for the day
      if (periods.present >= 1) {
        student.presentDays++
      } else {
        student.absentDays++
      }
    })
    
    student.percentage = workingDays > 0 ? (student.presentDays / workingDays) * 100 : 0
    delete student.dailyPeriods
  })

  const result = Array.from(studentStats.values()).map(student => ({
    pin: student.pin,
    name: student.name,
    presentDays: student.presentDays,
    absentDays: student.absentDays,
    percentage: Number(student.percentage.toFixed(2))
  }))

  return {
    subject,
    month,
    workingDays,
    students: result
  }
}

export async function getMonthlySummary(req, res) {
  try {
    const { department, semester, shift, subject, month } = req.query || {}
    if (!department || !semester || !shift || !subject || !month) {
      return res
        .status(400)
        .json({ message: 'department, semester, shift, subject, month are required' })
    }

    const result = await buildMonthlySummary({ department, semester, shift, subject, month })
    return res.json(result)
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ message: err.message || 'Failed to build monthly summary' })
  }
}

export async function exportMonthlyExcel(req, res) {
  try {
    const { department, semester, shift, subject, month } = req.query || {}
    if (!department || !semester || !shift || !subject || !month) {
      return res
        .status(400)
        .json({ message: 'department, semester, shift, subject, month are required' })
    }

    const data = await buildMonthlySummary({ department, semester, shift, subject, month })

    const workbook = new ExcelJS.Workbook()
    const sheetName = `${subject} - ${month}`
    const sheet = workbook.addWorksheet(sheetName)

    sheet.columns = [
      { header: 'PIN', key: 'pin', width: 12 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Present', key: 'presentDays', width: 12 },
      { header: 'Absent', key: 'absentDays', width: 12 },
      { header: '%', key: 'percentage', width: 10 },
    ]

    data.students.forEach(student => {
      sheet.addRow({
        pin: student.pin,
        name: student.name,
        workingDays: data.workingDays,
        presentDays: student.presentDays,
        absentDays: student.absentDays,
        percentage: student.percentage
      })
    })

    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    const footerRow = sheet.rowCount + 2
    sheet.getCell(`A${footerRow}`).value = 'Total Working Days:'
    sheet.getCell(`B${footerRow}`).value = data.workingDays
    sheet.getCell(`A${footerRow + 1}`).value = 'Subject:'
    sheet.getCell(`B${footerRow + 1}`).value = subject
    sheet.getCell(`A${footerRow + 2}`).value = 'Month:'
    sheet.getCell(`B${footerRow + 2}`).value = month
    sheet.getCell(`A${footerRow + 3}`).value = 'Generated By:'
    sheet.getCell(`B${footerRow + 3}`).value = 'Faculty Log Book System'

    for (let i = footerRow; i <= footerRow + 3; i++) {
      sheet.getRow(i).font = { bold: true }
    }

    const filename = `${subject}_${month}_attendance_report.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ message: err.message || 'Failed to export report' })
  }
}

export { buildMonthlySummary }

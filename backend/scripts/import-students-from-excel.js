import XLSX from 'xlsx'
import mongoose from 'mongoose'
import Student from '../src/models/Student.js'
import { connectDb } from '../src/config/db.js'
import dotenv from 'dotenv'
dotenv.config()

async function importStudents() {
  try {
    await connectDb(process.env.MONGODB_URI)
    console.log('📌 Connected to DB')

    const wb = XLSX.readFile('scripts/students.xlsx')
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)

    console.log(`📊 Found ${rows.length} rows in Excel`)

    // Clear existing students to avoid duplicates
    await Student.deleteMany({})
    console.log('🗑️ Cleared existing students')

    const shortPinCounts = new Map()
    const toInsert = []

    for (const row of rows) {
      const pin = String(row['PIN NUMBER']).trim()
      const name = String(row['NAME']).trim().replace(/\s+/g, ' ')
      const semester = String(row['SEM']).trim()
      const department = String(row['BRANCH']).trim().toLowerCase()
      const shiftValue = String(row['SHIFT']).trim()

      // Normalize shift to enum values
      let shift = '1st shift'
      if (shiftValue.includes('2')) shift = '2nd shift'

      // Derive year from semester
      let year = '1st year'
      if (semester.includes('3rd') || semester.includes('4th')) year = '2nd year'
      else if (semester.includes('5th') || semester.includes('6th')) year = '3rd year'

      // Generate 3-digit short PIN from full PIN (last 3 digits)
      const shortBase = pin.slice(-3).padStart(3, '0')
      const key = `${semester}-${shortBase}`

      const count = shortPinCounts.get(key) || 0
      shortPinCounts.set(key, count + 1)

      let shortPin = shortBase
      if (count > 0) {
        // Duplicate: prefix with T
        shortPin = `T${shortBase}`
      }

      toInsert.push({
        pin,
        shortPin,
        name,
        department,
        year,
        semester,
        shift,
        status: 'active',
      })
    }

    await Student.insertMany(toInsert)
    console.log(`✅ Inserted ${toInsert.length} students`)

    // Show summary
    const byDept = {}
    const bySem = {}
    const byShift = {}
    for (const s of toInsert) {
      byDept[s.department] = (byDept[s.department] || 0) + 1
      bySem[s.semester] = (bySem[s.semester] || 0) + 1
      byShift[s.shift] = (byShift[s.shift] || 0) + 1
    }

    console.log('📈 By department:', byDept)
    console.log('📈 By semester:', bySem)
    console.log('📈 By shift:', byShift)

    // Show duplicates
    const duplicates = [...shortPinCounts.entries()].filter(([_, cnt]) => cnt > 1)
    if (duplicates.length) {
      console.log('⚠️ Short PIN duplicates (prefixed with T):')
      duplicates.forEach(([k, cnt]) => console.log(` - ${k}: ${cnt}`))
    } else {
      console.log('✅ No short PIN conflicts')
    }

    console.log('🎉 Import complete')
    process.exit(0)
  } catch (err) {
    console.error('❌ Import error:', err)
    process.exit(1)
  }
}

importStudents()

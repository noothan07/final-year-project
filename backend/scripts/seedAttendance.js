/**
 * Attendance Seeding Script
 * Generates period-wise attendance data for all students
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Student from '../src/models/Student.js'
import PeriodAttendance from '../src/models/Attendance.js'
import { generateWeeklyTimetable, getWorkingDays, getAcademicDateRanges, generateWeeklyRanges } from '../src/utils/timetableGenerator.js'

dotenv.config()

/**
 * Generate attendance for a specific semester
 */
async function generateAttendanceForSemester(semester, students) {
  console.log(`\n📚 Processing ${semester}...`)
  
  const dateRanges = getAcademicDateRanges()
  const { start, end } = dateRanges[semester]
  
  if (!start || !end) {
    console.error(`❌ No date range found for ${semester}`)
    return
  }
  
  console.log(`📅 Date range: ${start.toDateString()} to ${end.toDateString()}`)
  
  // Get working days (excluding Sundays)
  const workingDays = getWorkingDays(start, end)
  console.log(`📊 Total working days: ${workingDays.length}`)
  
  // Group students by department and shift
  const studentGroups = {}
  students.forEach(student => {
    const key = `${student.department}-${student.shift}`
    if (!studentGroups[key]) {
      studentGroups[key] = []
    }
    studentGroups[key].push(student)
  })
  
  console.log(`👥 Student groups: ${Object.keys(studentGroups).length}`)
  
  // Generate weekly ranges and process each week
  const weeklyRanges = generateWeeklyRanges(workingDays)
  console.log(`📋 Weekly ranges: ${weeklyRanges.length}`)
  
  let totalRecords = 0
  
  for (const [groupKey, groupStudents] of Object.entries(studentGroups)) {
    const [department, shift] = groupKey.split('-')
    console.log(`\n🏫 Processing ${department} - ${shift} (${groupStudents.length} students)`)
    
    // Generate weekly timetable for this group
    const weeklyTimetable = generateWeeklyTimetable(semester)
    
    // Process each week
    for (let weekIndex = 0; weekIndex < weeklyRanges.length; weekIndex++) {
      const weekDays = weeklyRanges[weekIndex]
      
      if (weekDays.length === 0) continue
      
      // Process each day in the week
      for (let dayIndex = 0; dayIndex < weekDays.length && dayIndex < 6; dayIndex++) {
        const date = weekDays[dayIndex]
        const dayTimetable = weeklyTimetable[dayIndex]
        
        // Process each period
        for (let period = 1; period <= 7; period++) {
          const subject = dayTimetable[period - 1]
          
          if (!subject) {
            console.warn(`⚠️  No subject found for period ${period} on ${date.toDateString()}`)
            continue
          }
          
          // Generate attendance for this period
          const { absentees, presents } = generatePeriodAttendance(groupStudents)
          
          // Create attendance record
          const attendanceRecord = new PeriodAttendance({
            department,
            semester,
            shift,
            subject,
            period,
            date: new Date(date),
            absentees,
            presents
          })
          
          try {
            await attendanceRecord.save()
            totalRecords++
          } catch (error) {
            if (error.code === 11000) {
              console.warn(`⚠️  Duplicate record skipped: ${department}-${semester}-${shift}-${subject}-${period}-${date.toDateString()}`)
            } else {
              console.error(`❌ Error saving record:`, error.message)
            }
          }
        }
      }
    }
  }
  
  console.log(`✅ Generated ${totalRecords} attendance records for ${semester}`)
  return totalRecords
}

/**
 * Generate period-wise attendance (10-20% absent)
 */
function generatePeriodAttendance(students) {
  const totalStudents = students.length
  const absentPercentage = Math.random() * 0.1 + 0.1 // 10-20%
  const absentCount = Math.floor(totalStudents * absentPercentage)
  
  // Shuffle students and pick absentees
  const shuffled = [...students].sort(() => Math.random() - 0.5)
  const absentees = shuffled.slice(0, absentCount).map(s => s.pin)
  const presents = shuffled.slice(absentCount).map(s => s.pin)
  
  return { absentees, presents }
}

/**
 * Main seeding function
 */
async function seedAttendance() {
  try {
    console.log('🚀 Starting attendance seeding...')
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to database')
    
    // Clear existing attendance data
    console.log('🧹 Clearing existing attendance data...')
    await PeriodAttendance.deleteMany({})
    console.log('✅ Cleared existing attendance data')
    
    // Get all students grouped by semester
    const students = await Student.find({ status: 'active' })
    console.log(`👥 Found ${students.length} active students`)
    
    const studentsBySemester = {}
    students.forEach(student => {
      if (!studentsBySemester[student.semester]) {
        studentsBySemester[student.semester] = []
      }
      studentsBySemester[student.semester].push(student)
    })
    
    console.log('📚 Students by semester:')
    Object.keys(studentsBySemester).forEach(semester => {
      console.log(`  ${semester}: ${studentsBySemester[semester].length} students`)
    })
    
    // Generate attendance for each semester
    let totalRecords = 0
    const semesters = ['1st semester', '4th semester', '5th semester']
    
    for (const semester of semesters) {
      const semesterStudents = studentsBySemester[semester] || []
      if (semesterStudents.length > 0) {
        const records = await generateAttendanceForSemester(semester, semesterStudents)
        totalRecords += records
      } else {
        console.log(`⚠️  No students found for ${semester}`)
      }
    }
    
    console.log(`\n🎉 Attendance seeding completed!`)
    console.log(`📊 Total records generated: ${totalRecords}`)
    
    // Verify data
    const totalRecordsInDb = await PeriodAttendance.countDocuments()
    console.log(`📈 Total records in database: ${totalRecordsInDb}`)
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from database')
  }
}

// Run the script
seedAttendance()

/**
 * Timetable Generator Utility
 * Generates realistic college timetables with subject distribution logic
 */

// Subject definitions by semester
export const SUBJECTS = {
  '1st semester': ['Maths', 'Physics', 'Chemistry', 'English', 'C', 'BCE'],
  '4th semester': ['SE', 'WT', 'COMP', 'Java', 'CN & CS'],
  '5th semester': ['IME', 'BD & CC', 'AP', 'IoT', 'Python']
}

/**
 * Generate weekly timetable for a semester
 * @param {string} semester - Semester string
 * @returns {Array} - 6 days x 7 periods timetable
 */
export function generateWeeklyTimetable(semester) {
  const subjects = SUBJECTS[semester]
  if (!subjects) {
    throw new Error(`No subjects defined for semester: ${semester}`)
  }

  const timetable = []
  
  // Initialize 6 days (Monday to Saturday) with 7 periods each
  for (let day = 0; day < 6; day++) {
    timetable[day] = new Array(7).fill(null)
  }

  // Track subject counts to ensure minimum 5 periods per week
  const subjectCounts = {}
  subjects.forEach(subject => {
    subjectCounts[subject] = 0
  })

  // First pass: distribute minimum 5 periods for each subject
  subjects.forEach(subject => {
    let periodsToAssign = 5
    
    while (periodsToAssign > 0) {
      const { day, period } = findRandomEmptySlot(timetable)
      
      // Try to create consecutive blocks for realistic distribution
      const blockSize = Math.min(Math.floor(Math.random() * 3) + 1, periodsToAssign)
      
      if (canPlaceBlock(timetable, day, period, blockSize)) {
        for (let i = 0; i < blockSize && periodsToAssign > 0; i++) {
          timetable[day][period + i] = subject
          subjectCounts[subject]++
          periodsToAssign--
        }
      }
    }
  })

  // Second pass: fill remaining slots with random subjects
  // respecting max 10 periods per week rule
  for (let day = 0; day < 6; day++) {
    for (let period = 0; period < 7; period++) {
      if (!timetable[day][period]) {
        const availableSubjects = subjects.filter(subject => subjectCounts[subject] < 10)
        if (availableSubjects.length > 0) {
          const subject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)]
          timetable[day][period] = subject
          subjectCounts[subject]++
        }
      }
    }
  }

  // Verify all slots are filled
  for (let day = 0; day < 6; day++) {
    for (let period = 0; period < 7; period++) {
      if (!timetable[day][period]) {
        throw new Error(`Failed to fill timetable slot: Day ${day}, Period ${period}`)
      }
    }
  }

  // Log subject distribution for verification
  console.log(`Subject distribution for ${semester}:`, subjectCounts)
  
  return timetable
}

/**
 * Find a random empty slot in the timetable
 */
function findRandomEmptySlot(timetable) {
  const emptySlots = []
  
  for (let day = 0; day < 6; day++) {
    for (let period = 0; period < 7; period++) {
      if (!timetable[day][period]) {
        emptySlots.push({ day, period })
      }
    }
  }
  
  if (emptySlots.length === 0) {
    throw new Error('No empty slots available in timetable')
  }
  
  return emptySlots[Math.floor(Math.random() * emptySlots.length)]
}

/**
 * Check if a block can be placed at the given position
 */
function canPlaceBlock(timetable, day, startPeriod, blockSize) {
  if (startPeriod + blockSize > 7) {
    return false
  }
  
  for (let i = 0; i < blockSize; i++) {
    if (timetable[day][startPeriod + i] !== null) {
      return false
    }
  }
  
  return true
}

/**
 * Get working days between two dates (excluding Sundays)
 */
export function getWorkingDays(startDate, endDate) {
  const workingDays = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    // Skip Sundays (day 0)
    if (dayOfWeek !== 0) {
      workingDays.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return workingDays
}

/**
 * Get academic calendar date ranges for each semester
 */
export function getAcademicDateRanges() {
  const currentYear = new Date().getFullYear()
  
  return {
    '1st semester': {
      start: new Date(currentYear - 1, 7, 1), // August 1 of previous year
      end: new Date(currentYear, 0, 31) // January 31 of current year
    },
    '4th semester': {
      start: new Date(currentYear - 1, 11, 1), // December 1 of previous year
      end: new Date(currentYear, 0, 31) // January 31 of current year
    },
    '5th semester': {
      start: new Date(currentYear - 1, 11, 1), // December 1 of previous year
      end: new Date(currentYear, 0, 31) // January 31 of current year
    }
  }
}

/**
 * Generate date ranges for weekly timetable generation
 */
export function generateWeeklyRanges(workingDays) {
  const weeklyRanges = []
  let currentWeek = []
  
  for (let i = 0; i < workingDays.length; i++) {
    currentWeek.push(workingDays[i])
    
    // Check if we've completed a week (6 working days) or reached the end
    if (currentWeek.length === 6 || i === workingDays.length - 1) {
      weeklyRanges.push([...currentWeek])
      currentWeek = []
    }
  }
  
  return weeklyRanges
}

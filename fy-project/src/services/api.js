import { http } from './http'

export async function login(email, password) {
  const { data } = await http.post('/api/auth/login', { email, password })
  return data
}

export async function getDashboardSummary(params) {
  const { data } = await http.get('/api/dashboard/summary', { params })
  return data
}

export async function getSubjectWiseSummary(params) {
  const { data } = await http.get('/api/dashboard/subject-wise', { params })
  return data
}

export async function getStudents(params) {
  const { data } = await http.get('/api/students', { params })
  return data
}

export async function createStudent(payload) {
  const { data } = await http.post('/api/students', payload)
  return data
}

export async function deleteStudent(pin) {
  const { data } = await http.delete(`/api/students/${pin}`)
  return data
}

export async function markAttendance(payload) {
  const { data } = await http.post('/api/attendance/mark', payload)
  return data
}

export async function checkAttendanceExists(params) {
  const { data } = await http.get('/api/attendance/exists', { params })
  return data
}

// Convert frontend semester to backend format
const SEMESTER_MAP = {
  '1st sem': '1st semester',
  '3rd sem': '3rd semester', 
  '4th sem': '4th semester',
  '5th sem': '5th semester'
}

export async function getMonthlyReport(params) {
  const { data } = await http.get('/api/reports/monthly', { 
    params: { 
      department: params.department,
      semester: SEMESTER_MAP[params.year] || params.year,
      shift: params.section,
      subject: params.subject,
      month: params.month
    } 
  })
  return data
}

export async function downloadMonthlyExcel(params) {
  const response = await http.get('/api/reports/monthly/excel', {
    params: {
      department: params.department,
      semester: SEMESTER_MAP[params.year] || params.year,
      shift: params.section,
      subject: params.subject,
      month: params.month
    },
    responseType: 'blob',
  })

  return response
}

export async function getWeeklyRegister(params) {
  const { data } = await http.get('/api/reports/weekly-register', { 
    params: { 
      department: params.department,
      semester: SEMESTER_MAP[params.year] || params.year,
      shift: params.section,
      weekStart: params.weekStart
    } 
  })
  return data
}

export async function downloadWeeklyExcel(params) {
  const response = await http.get('/api/reports/weekly-register/excel', {
    params: {
      department: params.department,
      semester: SEMESTER_MAP[params.year] || params.year,
      shift: params.section,
      weekStart: params.weekStart
    },
    responseType: 'blob',
  })

  return response
}

export async function getStudentAttendance(pin, department, semester) {
  const params = {}
  if (department) params.department = department
  if (semester) params.semester = semester
  
  const { data } = await http.get(`/api/public/student/${pin}`, { params })
  return data
}

export async function downloadStudentAttendanceExcel(pin) {
  const response = await http.get(`/api/public/student/${pin}/excel`, {
    responseType: 'blob',
  })
  return response
}

export async function getClassAttendance(params) {
  const { data } = await http.get('/api/attendance/class', { params })
  return data
}

export async function modifyAttendance(payload) {
  const { data } = await http.put('/api/attendance/modify', payload)
  return data
}

// New function to check attendance by period only (ignoring subject)
export async function checkPeriodAttendanceOnly(params) {
  // Create params without subject to force period-only checking
  const periodOnlyParams = {
    department: params.department,
    semester: params.semester,
    shift: params.shift,
    date: params.date,
    period: params.period
    // NO subject parameter - backend should return all attendance for this period
  }
  
  console.log('🔍 checkPeriodAttendanceOnly API call (PERIOD-ONLY):', periodOnlyParams)
  const { data } = await http.get('/api/attendance/period-check', { params: periodOnlyParams })
  return data
}

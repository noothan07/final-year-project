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

export async function getStudentAttendance(pin, params) {
  const { data } = await http.get(`/api/student/attendance/${pin}`, { params })
  return data
}

export async function getClassAttendance(params) {
  const { data } = await http.get('/api/attendance/class', { params })
  return data
}

export async function getMonthlySummary(params) {
  const { data } = await http.get('/api/dashboard/monthly-summary', { params })
  return data
}

export async function getWeeklySummary(params) {
  const { data } = await http.get('/api/dashboard/weekly-summary', { params })
  return data
}

export async function getTodaySummary(params) {
  const { data } = await http.get('/api/dashboard/today-summary', { params })
  return data
}

export async function getSubjectSummary(params) {
  const { data } = await http.get('/api/dashboard/subject-summary', { params })
  return data
}

export async function getPeriodAnalysis(params) {
  const { data } = await http.get('/api/dashboard/period-analysis', { params })
  return data
}

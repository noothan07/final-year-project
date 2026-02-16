import { http } from './http'

export async function login(email, password) {
  const { data } = await http.post('/api/auth/login', { email, password })
  return data
}

export async function getDashboardSummary(params) {
  const { data } = await http.get('/api/dashboard/summary', { params })
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

export async function getMonthlyReport(params) {
  const { data } = await http.get(`/api/student/monthly-report/${params.pin}`, { 
    params: { month: params.month, year: params.year } 
  })
  return data
}

export async function downloadMonthlyExcel(params) {
  const response = await http.get('/api/reports/excel', {
    params,
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

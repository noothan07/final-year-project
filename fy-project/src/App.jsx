import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Shell from './components/Shell.jsx'
import Attendance from './pages/Attendance.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Reports from './pages/Reports.jsx'
import Staff from './pages/Staff.jsx'
import StudentAttendance from './pages/StudentAttendance.jsx'
import StudentManagement from './pages/StudentManagement.jsx'

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-attendance" element={<StudentAttendance />} />

        <Route
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/student-management" element={<StudentManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  )
}

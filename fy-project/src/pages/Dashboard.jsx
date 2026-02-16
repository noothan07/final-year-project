import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { createStudent, getDashboardSummary, getStudents, deleteStudent } from '../services/api'
import { useClassSelection } from '../context/ClassContext'
import { useAuth } from '../context/AuthContext'

// Department options - show all branches but only enable CME
const DEPARTMENTS = [
  { value: 'cme', label: 'CME', disabled: false },
  { value: 'ece', label: 'ECE', disabled: true },
  { value: 'eee', label: 'EEE', disabled: true },
  { value: 'mech', label: 'Mech', disabled: true },
  { value: 'civil', label: 'Civil', disabled: true },
  { value: 'automobile', label: 'Automobile', disabled: true },
  { value: 'architecture', label: 'Architecture', disabled: true }
]

const SEMESTERS = ['1st semester', '3rd semester', '4th semester', '5th semester']
const SHIFTS = ['1st shift', '2nd shift']
// Student form options - CME only with correct years
const STUDENT_DEPARTMENTS = ['CME']
const STUDENT_YEARS = ['1st year', '2nd year', '3rd year']
const STUDENT_SEMESTERS = ['1st semester', '2nd semester', '3rd semester', '4th semester', '5th semester', '6th semester']
const STUDENT_SHIFTS = ['1st shift', '2nd shift']

// Simple Dropdown Component - Reliable and bug-free
function SimpleDropdown({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
  helperText = ''
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full rounded-xl border px-3 py-2 text-sm transition-all
          ${disabled 
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' 
            : 'border-blue-200 bg-white/80 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer'
          }
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : (option.label || option.value || option)
          const isDisabled = typeof option === 'object' ? option.disabled : false
          
          return (
            <option 
              key={`${optionValue}-${index}`}
              value={optionValue}
              disabled={isDisabled}
            >
              {optionLabel}
            </option>
          )
        })}
      </select>
      {helperText && (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}

function Card({ title, value, sub, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-primary-blue">{title}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
        </div>
        {icon && (
          <div className="ml-4 h-12 w-12 rounded-xl bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { selection, setSelection } = useClassSelection()
  const { faculty } = useAuth() // Add safety check for faculty data
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [studentForm, setStudentForm] = useState({
    pin: '',
    shortPin: '',
    name: '',
    department: '',
    year: '',
    semester: '',
    shift: '',
  })
  const [savingStudent, setSavingStudent] = useState(false)
  const [studentMsg, setStudentMsg] = useState('')
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [deletePin, setDeletePin] = useState('')
  const [deletingStudent, setDeletingStudent] = useState(false)

  // Dynamic subject options based on selected semester (removed - not needed for student management)
  const subjectOptions = useMemo(() => {
    return [] // Return empty array since subject dropdown was removed
  }, [])

  // Check if can load summary
  const canLoad = useMemo(() => {
    return (
      selection.department === 'cme' && 
      selection.year && 
      selection.section && 
      date
    )
  }, [selection, date])

  // Handle department change - reset dependent fields
  const handleDepartmentChange = (value) => {
    setSelection({ 
      ...selection, 
      department: value,
      year: '',
      section: '',
      subject: ''
    })
  }

  // Handle semester change - reset dependent fields
  const handleSemesterChange = (value) => {
    console.log('🔍 Semester changed to:', value) // Debug semester change
    setSelection({ 
      ...selection, 
      year: value,
      section: ''
    })
  }

  // Handle shift change
  const handleShiftChange = (value) => {
    console.log('🔍 Shift changed to:', value) // Debug shift change
    setSelection({ 
      ...selection, 
      section: value
    })
  }

  async function loadSummary() {
    if (!canLoad) return
    setError('')
    setLoading(true)

    try {
      const payload = {
        department: selection.department,
        year: selection.year, // frontend stores semester in selection.year
        semester: selection.year, // also send semester explicitly
        shift: selection.section, // frontend stores shift in selection.section
        date
      }
      console.log('🔍 Dashboard API payload:', payload)
      const response = await getDashboardSummary(payload)
      console.log('🔍 Dashboard API response:', response)
      // Handle both response formats: direct data or wrapped in summary
      const summaryData = response.summary || response
      setSummary(summaryData)
    } catch (err) {
      console.error('❌ Dashboard API error:', err)
      setError(err?.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    console.log('🔍 Current selection state:', selection) // Debug selection state
    
    if (!selection.department || !selection.year || !selection.section) {
      setError('Please select department, semester, and shift to load students')
      return
    }
    
    setLoadingStudents(true)
    setError('')
    
    // Map frontend selection to backend query params
    const params = {
      department: selection.department,
      semester: selection.year, // frontend stores semester in selection.year
      shift: selection.section  // frontend stores shift in selection.section
    }
    
    // Debug the actual selection values
    console.log('🔍 Selection values:', {
      department: selection.department,
      semester: selection.year,
      shift: selection.section
    })
    
    console.log('🔍 Loading students with params:', params)
    
    try {
      const { students: data } = await getStudents(params)
      setStudents(data || [])
      console.log(`✅ Loaded ${data?.length || 0} students`)
    } catch (err) {
      console.error('❌ Load students error:', err)
      setError(err?.response?.data?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  async function onAddStudent(e) {
    e.preventDefault()
    setStudentMsg('')
    setSavingStudent(true)

    try {
      await createStudent(studentForm)
      setStudentMsg('Student added')
      setStudentForm({ pin: '', shortPin: '', name: '', department: '', year: '', semester: '', shift: '' })
      // Reload students list
      if (selection.department && selection.year && selection.section) {
        loadStudents()
      }
    } catch (err) {
      setStudentMsg(err?.response?.data?.message || 'Failed to add student')
    } finally {
      setSavingStudent(false)
    }
  }

  async function onDeleteStudent() {
    if (!deletePin) {
      setError('Please enter a PIN to delete')
      return
    }
    
    setDeletingStudent(true)
    setError('')
    
    try {
      await deleteStudent(deletePin)
      setStudentMsg(`Student ${deletePin} deleted successfully`)
      setDeletePin('')
      // Reload students list
      if (selection.department && selection.year && selection.section) {
        loadStudents()
      }
    } catch (err) {
      setStudentMsg(err?.response?.data?.message || 'Failed to delete student')
    } finally {
      setDeletingStudent(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-5 sm:mt-10">
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Class & Date</div>
        <div className="mt-1 text-sm text-slate-600">
          Select a class and subject to view summary cards.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
          <SimpleDropdown
            label="Department"
            value={selection.department}
            onChange={handleDepartmentChange}
            options={DEPARTMENTS}
            placeholder="Select Department"
            helperText="Only CME is available"
          />
          
          <SimpleDropdown
            label="Semester"
            value={selection.year}
            onChange={handleSemesterChange}
            options={SEMESTERS}
            placeholder="Select Semester"
            disabled={!selection.department || selection.department !== 'cme'}
            helperText={!selection.department ? "Select department first" : "Select semester"}
          />
          
          <SimpleDropdown
            label="Shift"
            value={selection.section}
            onChange={handleShiftChange}
            options={SHIFTS}
            placeholder="Select Shift"
            helperText="Select class shift"
          />
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">Select summary date</p>
          </div>
        </div>

        <button
          onClick={loadSummary}
          disabled={loading}
          className="mt-4 rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Summary'}
        </button>

        <button
          onClick={loadStudents}
          disabled={loadingStudents || !selection.department || !selection.year || !selection.section}
          className="mt-4 ml-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
        >
          {loadingStudents ? 'Loading...' : 'Load Students'}
        </button>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card
          title="Total Students"
          value={loading ? '…' : summary?.totalStudents ?? '-'}
          sub="In selected class"
          icon={
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <Card
          title="Today's Attendance"
          value={loading ? '…' : summary ? `${summary.todaysAttendance?.present || 0}/${summary.todaysAttendance?.totalMarked || 0}` : '-'}
          sub="Present / Marked"
          icon={
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Card
          title="Monthly Average"
          value={loading ? '…' : summary ? `${summary.monthlyAverage || 0}%` : '-'}
          sub="Current month (subject-wise)"
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <Card
          title="Loaded Students"
          value={loadingStudents ? '…' : students.length}
          sub="In current class"
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-8 0H5a4 4 0 00-8 0v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {students.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
          <div className="text-base font-semibold text-primary-blue mb-4">Students List ({students.length})</div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 15).map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.pin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 15 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing 15 of {students.length} students
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Student Management</div>
        <div className="mt-1 text-sm text-slate-600">Add or remove students from the system.</div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {/* Add Student Form */}
          <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
            <div className="text-base font-semibold text-primary-blue mb-4">Add Student</div>
            <form onSubmit={onAddStudent} id="student-form" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                value={studentForm.pin}
                onChange={(e) => setStudentForm({ ...studentForm, pin: e.target.value })}
                className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                placeholder="PIN (e.g., 25010-CM-001)"
                required
              />
              <input
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                placeholder="Name"
                required
              />
              <SimpleDropdown
                label="Department"
                value={studentForm.department}
                onChange={(value) => setStudentForm({ ...studentForm, department: value })}
                options={STUDENT_DEPARTMENTS}
                placeholder="Select Department"
              />
              <SimpleDropdown
                label="Year"
                value={studentForm.year}
                onChange={(value) => setStudentForm({ ...studentForm, year: value })}
                options={STUDENT_YEARS}
                placeholder="Select Year"
              />
              <SimpleDropdown
                label="Semester"
                value={studentForm.semester}
                onChange={(value) => setStudentForm({ ...studentForm, semester: value })}
                options={STUDENT_SEMESTERS}
                placeholder="Select Semester"
              />
              <SimpleDropdown
                label="Shift"
                value={studentForm.shift}
                onChange={(value) => setStudentForm({ ...studentForm, shift: value })}
                options={STUDENT_SHIFTS}
                placeholder="Select Shift"
              />
            </form>

            <div className="mt-4 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                form="student-form"
                disabled={savingStudent}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
              >
                {savingStudent ? 'Adding...' : 'Add Student'}
              </motion.button>

              {studentMsg && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${
                  studentMsg.includes('Failed') 
                    ? 'border-red-200 bg-red-50 text-red-600' 
                    : 'border-green-200 bg-green-50 text-green-600'
                }`}>
                  {studentMsg}
                </div>
              )}
            </div>
          </div>

          {/* Delete Student Form */}
          <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
            <div className="text-base font-semibold text-primary-blue mb-4">Remove Student</div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student PIN to Delete
                </label>
                <input
                  type="text"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:bg-white"
                  placeholder="Enter PIN to delete (e.g., 25010-CM-001)"
                />
                <p className="text-xs text-slate-500 mt-1">This action cannot be undone!</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onDeleteStudent}
                disabled={deletingStudent || !deletePin}
                className="w-full rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
              >
                {deletingStudent ? 'Deleting...' : 'Delete Student'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

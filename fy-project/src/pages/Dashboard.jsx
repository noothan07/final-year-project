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
// Student form options - show all branches but only enable CME
const STUDENT_DEPARTMENTS = [
  { value: 'CME', label: 'CME', disabled: false },
  { value: 'ECE', label: 'ECE', disabled: true },
  { value: 'EEE', label: 'EEE', disabled: true },
  { value: 'MECH', label: 'MECH', disabled: true },
  { value: 'CIVIL', label: 'CIVIL', disabled: true },
  { value: 'AUTOMOBILE', label: 'AUTOMOBILE', disabled: true },
  { value: 'ARCHITECTURE', label: 'ARCHITECTURE', disabled: true }
]
const STUDENT_YEARS = ['1st year', '2nd year', '3rd year']
const STUDENT_SEMESTERS = ['1st semester', '3rd semester', '4th semester', '5th semester']
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
  
  // Handle date change
  const handleDateChange = (value) => {
    setDate(value)
    setSummary(null) // Clear previous summary when date changes
    setError('') // Clear error messages
  }

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [studentForm, setStudentForm] = useState({
    pin: '',
    name: '',
    department: '',
    year: '',
    semester: '',
    shift: '',
  })
  const [savingStudent, setSavingStudent] = useState(false)
  const [studentMsg, setStudentMsg] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState('success') // 'success' or 'error'
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [deletePin, setDeletePin] = useState('')
  const [deletingStudent, setDeletingStudent] = useState(false)

  // Subject definitions by semester - matching backend timetable generator
  const SUBJECTS = {
    '1st semester': ['Maths', 'Physics', 'Chemistry', 'English', 'C', 'BCE'],
    '3rd semester': ['DSA', 'M2', 'DE', 'OS', 'DBMS'],
    '4th semester': ['SE', 'WT', 'COMP', 'Java', 'CN & CS'],
    '5th semester': ['IME', 'BD & CC', 'AP', 'IoT', 'Python']
  }

  // Dynamic subject options based on selected semester
  const subjectOptions = useMemo(() => {
    if (!selection.year) return []
    return SUBJECTS[selection.year] || []
  }, [selection.year])

  // Check if can load summary
  const canLoad = useMemo(() => {
    return (
      selection.department === 'cme' && 
      selection.year && 
      selection.section && 
      selection.subject &&
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
    setSummary(null) // Clear previous summary when department changes
    setError('') // Clear error messages
  }

  // Handle semester change - reset dependent fields
  const handleSemesterChange = (value) => {
    setSelection({ 
      ...selection, 
      year: value,
      section: '',
      subject: ''
    })
    setSummary(null) // Clear previous summary when semester changes
    setError('') // Clear error messages
  }

  // Handle shift change
  const handleShiftChange = (value) => {
    setSelection({ 
      ...selection, 
      section: value
    })
    setSummary(null) // Clear previous summary when shift changes
    setError('') // Clear error messages
  }

  // Handle subject change
  const handleSubjectChange = (value) => {
    setSelection({ 
      ...selection, 
      subject: value
    })
    setSummary(null) // Clear previous summary when subject changes
    setError('') // Clear error messages
  }

  async function loadSummary() {
    if (!canLoad) return
    setError('')
    setLoading(true)
    // Clear previous summary immediately to prevent showing old data
    setSummary(null)

    try {
      const payload = {
        department: selection.department,
        year: selection.year, // frontend stores semester in selection.year
        semester: selection.year, // also send semester explicitly
        shift: selection.section, // frontend stores shift in selection.section
        subject: selection.subject, // add subject parameter
        date
      }
      const response = await getDashboardSummary(payload)
      
      // Handle different response formats
      let summaryData = response
      
      // Check if response is wrapped in a summary object
      if (response.summary) {
        summaryData = response.summary
      }
      
      // Check if response has data field
      if (response.data) {
        summaryData = response.data
      }
      
      // Check if we have valid data
      if (summaryData && (typeof summaryData === 'object') && Object.keys(summaryData).length > 0) {
        setSummary(summaryData)
        showToastMessage(`Summary loaded successfully for ${selection.subject}`, `Summary loaded for ${selection.subject}`, 'success')
      } else {
        setSummary(null)
        setError(`No attendance data found for ${selection.subject} on ${date}`)
        showToastMessage(`No attendance data found for ${selection.subject} on ${date}`, 'No data found', 'error')
      }
    } catch (err) {
      // Clear summary on error
      setSummary(null)
      let errorMessage = 'Failed to load dashboard summary'
      
      if (err?.response?.status === 404) {
        errorMessage = err?.response?.data?.message || `No attendance data found for ${selection.subject} on ${date}`
        setError(errorMessage)
      } else if (err?.response?.data?.message) {
        errorMessage = err?.response?.data?.message
        setError(errorMessage)
      } else {
        setError(errorMessage)
      }
      
      showToastMessage(errorMessage, 'An error occurred while loading data', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    if (!selection.department || !selection.year || !selection.section) {
      setError('Please select department, semester, and shift to load students')
      return
    }
    
    setLoadingStudents(true)
    setError('')
    
    const params = {
      department: selection.department,
      semester: selection.year,
      shift: selection.section
    }
    
    try {
      const { students: data } = await getStudents(params)
      setStudents(data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Function to capitalize PIN characters while typing
  const handlePinChange = (e) => {
    const value = e.target.value.toUpperCase()
    setStudentForm({ ...studentForm, pin: value })
  }

  // Function to handle student department change (store in lowercase)
  const handleStudentDepartmentChange = (value) => {
    setStudentForm({ ...studentForm, department: value.toLowerCase() })
  }

  // Function to handle delete PIN change (auto-capitalize)
  const handleDeletePinChange = (e) => {
    const value = e.target.value.toUpperCase()
    setDeletePin(value)
  }

  // Toast notification function with responsive messages
  // Customize messages below for different screen sizes:
  // showToastMessage(largeScreenMessage, mobileMessage, type)
  // - largeScreenMessage: For tablets and desktops (can be detailed)
  // - mobileMessage: For mobile phones (medium length, not too short)
  const showToastMessage = (largeScreenMessage, mobileMessage, type = 'success') => {
    setStudentMsg({ large: largeScreenMessage, mobile: mobileMessage })
    setToastType(type)
    setShowToast(true)
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  // PIN validation function
  const validatePin = (pin) => {
    if (!pin || pin.trim() === '') {
      return { isValid: false, message: 'PIN is required' }
    }
    
    // Check format: XXXXX-XX-XXX (e.g., 25010-CM-001)
    const pinPattern = /^\d{5}-[A-Z]{2}-\d{3}$/
    if (!pinPattern.test(pin)) {
      return { 
        isValid: false, 
        message: 'PIN must be in format XXXXX-XX-XXX (e.g., 25010-CM-001)' 
      }
    }
    
    return { isValid: true, message: '' }
  }

  async function onAddStudent(e) {
    e.preventDefault()
    setSavingStudent(true)

    // Validate PIN format
    const pinValidation = validatePin(studentForm.pin)
    if (!pinValidation.isValid) {
      showToastMessage(pinValidation.message, 'PIN format is invalid', 'error')
      setSavingStudent(false)
      return
    }

    // Validate other required fields
    if (!studentForm.name || !studentForm.department || !studentForm.year || !studentForm.semester || !studentForm.shift) {
      showToastMessage('Please fill all required fields', 'All fields are required', 'error')
      setSavingStudent(false)
      return
    }

    try {
      await createStudent(studentForm)
      showToastMessage('Student added successfully!', 'Student was added successfully', 'success')
      setStudentForm({ pin: '', name: '', department: '', year: '', semester: '', shift: '' })
      // Reload students list
      if (selection.department && selection.year && selection.section) {
        loadStudents()
      }
    } catch (err) {
      // Handle duplicate PIN error specifically
      if (err?.response?.status === 409) {
        showToastMessage('Student with this PIN already exists. No duplicate PIN numbers are allowed.', 'Student PIN already exists', 'error')
      } else if (err?.response?.data?.message?.includes('already exists') || err?.response?.data?.message?.includes('PIN already exists')) {
        showToastMessage('Student with this PIN already exists. No duplicate PIN numbers are allowed.', 'Student PIN already exists', 'error')
      } else {
        showToastMessage(err?.response?.data?.message || 'Failed to add student', 'Failed to add student', 'error')
      }
    } finally {
      setSavingStudent(false)
    }
  }

  async function onDeleteStudent() {
    if (!deletePin) {
      showToastMessage('Please enter a PIN to delete', 'Please enter student PIN', 'error')
      return
    }

    // Validate PIN format
    const pinValidation = validatePin(deletePin)
    if (!pinValidation.isValid) {
      showToastMessage(pinValidation.message, 'PIN format is invalid', 'error')
      return
    }
    
    setDeletingStudent(true)
    
    try {
      await deleteStudent(deletePin)
      showToastMessage(`Student ${deletePin} deleted successfully`, `Student ${deletePin} was deleted`, 'success')
      setDeletePin('')
      // Reload students list
      if (selection.department && selection.year && selection.section) {
        loadStudents()
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        showToastMessage('Student with this PIN not found', 'Student PIN not found', 'error')
      } else {
        showToastMessage(err?.response?.data?.message || 'Failed to delete student', 'Failed to delete student', 'error')
      }
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
          
          <SimpleDropdown
            label="Subject"
            value={selection.subject}
            onChange={handleSubjectChange}
            options={subjectOptions}
            placeholder="Select Subject"
            disabled={!selection.year}
            helperText={!selection.year ? "Select semester first" : "Select subject for attendance"}
          />
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">Select summary date (past and present only)</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <motion.button
            onClick={loadSummary}
            disabled={loading || !canLoad}
            className="rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            whileHover={{ scale: loading || !canLoad ? 1 : 1.02 }}
            whileTap={{ scale: loading || !canLoad ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Summary...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Load Summary
              </>
            )}
          </motion.button>

          <motion.button
            onClick={loadStudents}
            disabled={loadingStudents || !selection.department || !selection.year || !selection.section}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            whileHover={{ scale: loadingStudents || !selection.department || !selection.year || !selection.section ? 1 : 1.02 }}
            whileTap={{ scale: loadingStudents || !selection.department || !selection.year || !selection.section ? 1 : 0.98 }}
          >
            {loadingStudents ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Students...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Load Students
              </>
            )}
          </motion.button>
        </div>
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
          value={loading ? '…' : summary ? (
            summary.todaysAttendance ? 
              `${summary.todaysAttendance.present || 0}/${summary.todaysAttendance.total || summary.totalStudents || 0}` :
              summary.present !== undefined && summary.total !== undefined ?
                `${summary.present}/${summary.total}` :
                '-'
          ) : '-'}
          sub={`Present on ${date} for ${selection.subject || 'selected subject'}`}
          icon={
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Card
          title="Monthly Average"
          value={loading ? '…' : summary ? `${summary.monthlyAverage || 0}%` : '-'}
          sub={`${selection.subject || 'selected subject'} - ${new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                {students.slice(0, 20).map((student) => (
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
            {students.length > 20 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing 20 of {students.length} students
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-3 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Student Management</div>
        <div className="mt-1 text-sm text-slate-600">Add or remove students from the system.</div>

        <div className="mt-4 space-y-4 lg:space-y-6">
          {/* Add Student Form */}
          <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-4 sm:p-6 shadow-professional">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="text-base sm:text-lg font-semibold text-primary-blue mb-2 sm:mb-0">Add Student</div>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Auto-generates short PIN</span>
              </div>
            </div>

            <form onSubmit={onAddStudent} id="student-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={studentForm.pin}
                    onChange={handlePinChange}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                    placeholder="e.g., 25010-CM-001"
                    required
                  />
                  <p className="text-xs text-slate-500">Format: XXXXX-XX-XXX</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value.toLowerCase() })}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Department</option>
                    {STUDENT_DEPARTMENTS.map((dept, index) => (
                      <option 
                        key={`${dept.value}-${index}`}
                        value={dept.value.toLowerCase()}
                        disabled={dept.disabled}
                        className={dept.disabled ? 'text-gray-400' : ''}
                      >
                        {dept.label} {dept.disabled && '(Unavailable)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">Only CME is available</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Year</option>
                    {STUDENT_YEARS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Semester</option>
                    {STUDENT_SEMESTERS.map((semester) => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Shift <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentForm.shift}
                    onChange={(e) => setStudentForm({ ...studentForm, shift: e.target.value })}
                    className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Shift</option>
                    {STUDENT_SHIFTS.map((shift) => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  form="student-form"
                  disabled={savingStudent}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium text-sm shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {savingStudent ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Student
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setStudentForm({ pin: '', name: '', department: '', year: '', semester: '', shift: '' })}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear Data
                </motion.button>
              </div>
            </form>
          </div>

          </div>

        {/* Separate Remove Student Section */}
        <div className="mt-6">
          <div className="bg-white rounded-xl border border-blue-100  p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Remove Student</h2>
                  <p className="text-sm text-gray-600">Permanent deletion of student records</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full mt-3 sm:mt-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Irreversible action</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Input Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student PIN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={deletePin}
                      onChange={handleDeletePinChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                      placeholder="Enter PIN (e.g., 25010-CM-001)"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: XXXXX-XX-XXX</p>
                  
                  {/* Actions - Moved inside input area */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onDeleteStudent}
                      disabled={deletingStudent || !deletePin}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {deletingStudent ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Student
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setDeletePin('')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clear Input
                    </motion.button>
                  </div>
                </div>
                
                {/* Enhanced Desktop Warning */}
                <div className="hidden sm:flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ This action cannot be undone</p>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-1 shrink-0"></div>
                        <div>
                          <p className="text-sm  text-amber-800">All student information will be permanently deleted</p>
                          
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-1 shrink-0"></div>
                        <div>
                          <p className="text-sm text-amber-800">Complete attendance history will be removed</p>
                        
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full mt-1 shrink-0"></div>
                        <div>
                          <p className="text-sm text-amber-800">All academic records will be lost forever</p>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Warning */}
              <div className="sm:hidden">
                <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ This action cannot be undone</p>
                    <p className="text-xs text-amber-700 mb-1">Student data, attendance records, and academic history will be permanently deleted</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full shrink-0"></div>
                        <p className="text-xs text-amber-700">• Student Data: All personal information</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full shrink-0"></div>
                        <p className="text-xs text-amber-700">• Attendance Records: Complete history</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-amber-600 rounded-full shrink-0"></div>
                        <p className="text-xs text-amber-700">• Academic History: All records lost</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm mx-4 px-4"
        >
          <div className={`px-4 py-3 rounded-lg shadow-lg border flex items-center space-x-3 ${
            toastType === 'success' 
              ? 'bg-green-500 text-white border-green-400' 
              : 'bg-red-500 text-white border-red-400'
          }`}>
            <div className="shrink-0">
              {toastType === 'success' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium truncate">
              {/* Full message for larger screens, medium for mobile */}
              <span className="hidden sm:inline">{studentMsg?.large || studentMsg?.mobile || studentMsg}</span>
              <span className="sm:hidden">{studentMsg?.mobile || studentMsg?.large || studentMsg}</span>
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

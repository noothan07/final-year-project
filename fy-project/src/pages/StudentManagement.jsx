import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createStudent, getStudents, deleteStudent } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

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

export default function StudentManagement() {
  // Selection state
  const [selection, setSelection] = useState({
    department: '',
    semester: '',
    shift: '',
  })

  // Student form state
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
  const [toastType, setToastType] = useState('success')

  // Students list state
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [deletePin, setDeletePin] = useState('')
  const [deletingStudent, setDeletingStudent] = useState(false)

  // Dialog states
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [showDeleteStudentDialog, setShowDeleteStudentDialog] = useState(false)
  const [pendingStudentData, setPendingStudentData] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const [studentsPerPage] = useState(15)

  // Handle selection changes
  const handleDepartmentChange = (value) => {
    setSelection({ 
      ...selection, 
      department: value,
      semester: '',
      shift: ''
    })
    setStudents([])
    setCurrentPage(1)
  }

  const handleSemesterChange = (value) => {
    setSelection({ 
      ...selection, 
      semester: value,
      shift: ''
    })
    setStudents([])
    setCurrentPage(1)
  }

  const handleShiftChange = (value) => {
    setSelection(prev => ({ ...prev, shift: value }))
    setStudents([])
    setCurrentPage(1)
  }

  // Load students with pagination
  async function loadStudents(page = 1) {
    if (!selection.department || !selection.semester || !selection.shift) {
      showToastMessage('Please select department, semester, and shift to load students', 'Select all fields', 'error')
      return
    }

    setLoadingStudents(true)
    try {
      const response = await getStudents({
        department: selection.department,
        semester: selection.semester,
        shift: selection.shift,
        // Note: Backend doesn't support pagination yet, sending all params for future compatibility
      })

      console.log('Students API response:', response) // Debug log

      // Backend returns { students } directly
      let studentsData = []
      let totalCount = 0

      if (response && response.students && Array.isArray(response.students)) {
        studentsData = response.students
        totalCount = response.students.length
      } else if (Array.isArray(response)) {
        studentsData = response
        totalCount = response.length
      }

      // Client-side pagination since backend doesn't support it yet
      const startIndex = (page - 1) * studentsPerPage
      const endIndex = startIndex + studentsPerPage
      const paginatedStudents = studentsData.slice(startIndex, endIndex)

      if (studentsData.length > 0) {
        setStudents(paginatedStudents)
        setTotalStudents(totalCount)
        setCurrentPage(page)
        // Only show toast on initial load (page 1)
        if (page === 1) {
          showToastMessage(`Loaded ${paginatedStudents.length} of ${studentsData.length} students`, 'Students loaded', 'success')
        }
      } else {
        setStudents([])
        setTotalStudents(0)
        setCurrentPage(1)
        showToastMessage('No students found for the selected criteria', 'No students found', 'info')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([])
      setTotalStudents(0)
      setCurrentPage(1)
      showToastMessage('Failed to load students. Please try again.', 'Failed to load students', 'error')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Handle form changes
  const handlePinChange = (e) => {
    const value = e.target.value.toUpperCase()
    setStudentForm({ ...studentForm, pin: value })
  }

  const handleDeletePinChange = (e) => {
    const value = e.target.value.toUpperCase()
    setDeletePin(value)
  }

  // Toast notification function
  const showToastMessage = (largeScreenMessage, mobileMessage, type = 'success') => {
    setStudentMsg({ large: largeScreenMessage, mobile: mobileMessage })
    setToastType(type)
    setShowToast(true)
    
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

  // Add student
  async function onAddStudent(e) {
    if (e) e.preventDefault()

    // Validate PIN format
    const pinValidation = validatePin(studentForm.pin)
    if (!pinValidation.isValid) {
      showToastMessage(pinValidation.message, 'PIN format is invalid', 'error')
      return
    }

    // Validate other required fields
    if (!studentForm.name || !studentForm.department || !studentForm.year || !studentForm.semester || !studentForm.shift) {
      showToastMessage('Please fill all required fields', 'All fields are required', 'error')
      return
    }

    setPendingStudentData({ ...studentForm })
    setShowAddStudentDialog(true)
  }

  async function confirmAddStudent() {
    if (!pendingStudentData) return

    setSavingStudent(true)
    setShowAddStudentDialog(false)

    try {
      const response = await createStudent(pendingStudentData)

      console.log('Create student response:', response) // Debug log

      // Backend returns { student } directly on success
      if (response && response.student) {
        showToastMessage(
          `Student ${pendingStudentData.name} (${pendingStudentData.pin}) added successfully!`,
          'Student added successfully!',
          'success'
        )

        // Reset form
        setStudentForm({
          pin: '',
          name: '',
          department: '',
          year: '',
          semester: '',
          shift: '',
        })

        // Reload students if we have a selection
        if (selection.department && selection.semester && selection.shift) {
          loadStudents(currentPage)
        }

        setPendingStudentData(null)
      } else {
        showToastMessage(
          response?.message || 'Failed to add student',
          'Failed to add student',
          'error'
        )

        setShowAddStudentDialog(true)
      }
    } catch (error) {
      const status = error?.response?.status
      const data = error?.response?.data

      if (status === 409) {
        console.warn('Add student conflict (PIN already exists):', data)
      } else {
        console.error('Error adding student:', error)
        console.error('Error response:', data)
        console.error('Error status:', status)
      }
      
      let errorMessage = 'Failed to add student. Please try again.'
      
      // Handle different error cases - check multiple places for message
      if (status === 409) {
        const existing = data?.existingStudent
        if (existing) {
          errorMessage = `PIN already exists for ${existing.name} (${existing.pin}) in ${existing.semester}, ${existing.shift}.`
        } else {
          errorMessage = data?.message || 'PIN already exists. No duplicate PIN numbers are allowed.'
        }
      } else if (data?.message) {
        errorMessage = data.message
      } else if (data && typeof data === 'string') {
        errorMessage = data
      } else if (status === 400) {
        errorMessage = 'Invalid student data. Please check all fields.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      // Show toast message immediately
      showToastMessage(errorMessage, 'Error adding student', 'error')

      // Keep dialog open so user can try again
      setShowAddStudentDialog(true)
    } finally {
      setSavingStudent(false)
    }
  }

  // Delete student
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

    setShowDeleteStudentDialog(true)
  }

  async function confirmDeleteStudent() {
    if (!validatePin(deletePin).isValid) {
      showToastMessage('Please enter a valid PIN (at least 4 digits)', 'Valid PIN required', 'error')
      return
    }

    setDeletingStudent(true)
    setShowDeleteStudentDialog(false)

    try {
      const response = await deleteStudent(deletePin)

      console.log('Delete student response:', response) // Debug log

      // Backend returns { message, student } on success
      if (response && response.message) {
        showToastMessage(
          response.message || `Student with PIN ${deletePin} deleted successfully!`,
          'Student deleted successfully!',
          'success'
        )

        // Reset delete PIN
        setDeletePin('')

        // Reload students if we have a selection
        if (selection.department && selection.semester && selection.shift) {
          loadStudents(currentPage)
        }
      } else {
        showToastMessage(
          response?.message || 'Failed to delete student',
          'Failed to delete student',
          'error'
        )
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      if (error?.response?.status === 404) {
        showToastMessage('Student with this PIN not found', 'Student PIN not found', 'error')
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to delete student. Please try again.'
        showToastMessage(errorMessage, 'Failed to delete student', 'error')
      }
    } finally {
      setDeletingStudent(false)
      setShowDeleteStudentDialog(false)
    }
  }

  const canLoadStudents = selection.department && selection.semester && selection.shift

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-full overflow-x-hidden">
        {/* Selection Dropdowns */}
        <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
          <div className="text-base font-semibold text-primary-blue">Student Selection</div>
          <div className="mt-1 text-sm text-slate-600">
            Select department, semester, and shift to load students.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
            <SimpleDropdown
              label="Branch"
              value={selection.department}
              onChange={handleDepartmentChange}
              options={DEPARTMENTS}
              placeholder="Select Branch"
            />
            
            <SimpleDropdown
              label="Semester"
              value={selection.semester}
              onChange={handleSemesterChange}
              options={SEMESTERS}
              placeholder="Select Semester"
              disabled={!selection.department || selection.department !== 'cme'}
            />
            
            <SimpleDropdown
              label="Shift"
              value={selection.shift}
              onChange={handleShiftChange}
              options={SHIFTS}
              placeholder="Select Shift"
            />
          </div>

          {/* Load Students Button - Moved below dropdowns and left-aligned */}
          <div className="mt-4 flex justify-start">
            <motion.button
              whileHover={{ scale: loadingStudents || !canLoadStudents ? 1 : 1.02 }}
              whileTap={{ scale: loadingStudents || !canLoadStudents ? 1 : 0.98 }}
              disabled={!canLoadStudents || loadingStudents}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center ${
                canLoadStudents && !loadingStudents
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-blue-600/60 text-white cursor-not-allowed'
              }`}
              onClick={() => loadStudents(1)}
            >
              {loadingStudents ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Load Students
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Students List */}
        {students.length > 0 && (
          <div className="rounded-2xl bg-white p-6 border-blue-200 border max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-semibold text-primary-blue">
                Students List ({totalStudents} total)
              </div>
              <div className="text-sm text-slate-600">
                Page {currentPage} of {Math.ceil(totalStudents / studentsPerPage)}
              </div>
            </div>

            <div className="-mx-6 sm:mx-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain">
              <div className="inline-block min-w-full align-middle pl-6 sm:px-0">
                <table className="min-w-max sm:w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.pin} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.pin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.shift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            {totalStudents > studentsPerPage && (
              <div className="sticky bottom-0 mt-4 bg-white pt-3 border-t border-slate-200">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-700 flex justify-center sm:justify-baseline mb-3 sm:mb-1">
                  Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
                  </div>
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={() => loadStudents(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadStudents(currentPage + 1)}
                      disabled={currentPage * studentsPerPage >= totalStudents}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Student Form */}
        <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-4 sm:p-6 shadow-professional">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={studentForm.pin}
                      onChange={handlePinChange}
                      className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                      placeholder="e.g., 25010-CM-001"
                      required
                    />
                  </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
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
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
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
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentForm.year}
                  onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
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
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
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
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer"
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

        {/* Delete Student Form */}
        <div className="bg-white rounded-xl border border-blue-200 p-4 sm:p-6">
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
                        className="w-full px-3 py-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        placeholder="Enter PIN (e.g., 25010-CM-001)"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                
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
                        <p className="text-sm text-amber-800">All student information will be permanently deleted</p>
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
      </motion.div>

      {/* Add Student Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showAddStudentDialog}
        onClose={() => {
          setShowAddStudentDialog(false)
          setPendingStudentData(null)
        }}
        onConfirm={confirmAddStudent}
        title="Add Student"
        message={`Are you sure you want to add student ${pendingStudentData?.name} with PIN ${pendingStudentData?.pin}?`}
        confirmText="Add Student"
        cancelText="Cancel"
        type="success"
      />

      {/* Delete Student Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteStudentDialog}
        onClose={() => setShowDeleteStudentDialog(false)}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete student ${deletePin}? This action cannot be undone and all student data will be permanently lost.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        type="danger"
      />

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
    </>
  )
}

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react'
import { createPortal } from 'react-dom'

import { createStudent, getDashboardSummary } from '../services/api'
import { useClassSelection } from '../context/ClassContext'

// Global dropdown context to prevent multiple dropdowns from opening
const DropdownContext = createContext({
  openDropdownId: null,
  setOpenDropdownId: () => {}
})

function useDropdownContext() {
  return useContext(DropdownContext)
}

// Dropdown Provider component
function DropdownProvider({ children }) {
  const [openDropdownId, setOpenDropdownId] = useState(null)

  return (
    <DropdownContext.Provider value={{ openDropdownId, setOpenDropdownId }}>
      {children}
    </DropdownContext.Provider>
  )
}

// Frontend subject mapping for CME department
const SUBJECTS_BY_SEMESTER = {
  '1st sem': ['MPC', 'C Language', 'English', 'BCE'],
  '3rd sem': ['DSA', 'M2', 'DE', 'OS', 'DBMS'],
  '4th sem': ['SE', 'Web Technology', 'Computer Organization', 'Java', 'CN & CS'],
  '5th sem': ['IME', 'BD & CC', 'AP', 'IoT', 'Python']
}

// Department options with disabled state
const DEPARTMENTS = [
  { value: 'cme', label: 'CME', disabled: false },
  { value: 'ece', label: 'ECE', disabled: true },
  { value: 'eee', label: 'EEE', disabled: true },
  { value: 'mech', label: 'Mech', disabled: true },
  { value: 'civil', label: 'Civil', disabled: true },
  { value: 'automobile', label: 'Automobile', disabled: true },
  { value: 'architecture', label: 'Architecture', disabled: true }
]

const SEMESTERS = ['1st sem', '3rd sem', '4th sem', '5th sem']
const SHIFTS = ['1st shift', '2nd shift']

// Advanced Dropdown Component
function AdvancedDropdown({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
  helperText = '',
  showTooltip = false 
}) {
  const { openDropdownId, setOpenDropdownId } = useDropdownContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null) // Proper ref for the button
  
  // Generate unique ID for this dropdown
  const dropdownId = `dropdown-${label.replace(/\s+/g, '-').toLowerCase()}`
  const isOpen = openDropdownId === dropdownId

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setOpenDropdownId])

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setOpenDropdownId(null)
        setSearchTerm('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setOpenDropdownId])

  // Update dropdown position when open
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // 8px gap
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }

      updatePosition()
      
      // Update on resize and scroll
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition)
      
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition)
      }
    }
  }, [isOpen])

  const filteredOptions = options.filter(option => 
    option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(opt => 
    (opt.value || opt) === value
  )

  const handleSelect = (option, event) => {
    event?.stopPropagation()
    event?.preventDefault()
    console.log('handleSelect called with:', option) // Debug log
    if (!option.disabled) {
      const newValue = option.value || option
      console.log('Calling onChange with:', newValue) // Debug log
      onChange(newValue)
      setOpenDropdownId(null)
      setSearchTerm('')
    }
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setOpenDropdownId(isOpen ? null : dropdownId)
      if (isOpen) {
        setSearchTerm('')
      }
    }
  }

  return (
    // Main container with relative positioning for dropdown absolute positioning
    <div className="relative dropdown-container">
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>
      {/* Button container - relative for dropdown positioning */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className={`
            w-full rounded-xl border px-3 py-2 text-sm text-left transition-all
            flex items-center justify-between
            ${disabled 
              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' 
              : 'border-blue-200 bg-white/80 hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white cursor-pointer'
            }
          `}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
            {selectedOption ? (selectedOption.label || selectedOption) : placeholder}
          </span>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 
          PORTAL-BASED DROPDOWN MENU
          Renders dropdown menu outside Framer Motion's transform context
          This ensures proper z-index stacking and prevents clipping
        */}
        {isOpen && !disabled && createPortal(
          <div 
            className="fixed z-[9999] bg-white border border-blue-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
          >
            {options.length > 8 && (
              <div className="p-2 border-b border-blue-100">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option, index) => {
                const isSelected = (option.value || option) === value
                const isDisabled = option.disabled || false
                
                return (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      console.log('Button mouseDown for option:', option) // Debug log
                      handleSelect(option, e)
                    }}
                    disabled={isDisabled}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors
                      flex items-center justify-between
                      ${isSelected 
                        ? 'bg-primary-blue text-white' 
                        : isDisabled
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'text-slate-700 hover:bg-blue-50'
                      }
                    `}
                  >
                    <span>{option.label || option}</span>
                    {isDisabled && (
                      <span className="text-xs text-slate-400">Not available</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body // Render portal to document.body to escape transform context
        )}
      </div>
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [studentForm, setStudentForm] = useState({
    rollNo: '',
    name: '',
    department: '',
    year: '',
    section: '',
  })
  const [savingStudent, setSavingStudent] = useState(false)
  const [studentMsg, setStudentMsg] = useState('')

  // Dynamic subject options based on selected semester
  const subjectOptions = useMemo(() => {
    if (!selection.year || selection.department !== 'cme') return []
    return SUBJECTS_BY_SEMESTER[selection.year] || []
  }, [selection.year, selection.department])

  // Check if can load summary
  const canLoad = useMemo(
    () => Boolean(
      selection.department === 'cme' && 
      selection.year && 
      selection.section &&
      selection.subject &&
      date
    ),
    [selection, date]
  )

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

  // Handle semester change - reset subject
  const handleSemesterChange = (value) => {
    setSelection({ 
      ...selection, 
      year: value,
      subject: ''
    })
  }

  // Handle subject change
  const handleSubjectChange = (value) => {
    setSelection({ 
      ...selection, 
      subject: value
    })
  }

  // Handle shift change
  const handleShiftChange = (value) => {
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
      const data = await getDashboardSummary({ ...selection, date })
      setSummary(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function onAddStudent(e) {
    e.preventDefault()
    setStudentMsg('')
    setSavingStudent(true)

    try {
      await createStudent(studentForm)
      setStudentMsg('Student added')
      setStudentForm({ rollNo: '', name: '', department: '', year: '', section: '' })
    } catch (err) {
      setStudentMsg(err?.response?.data?.message || 'Failed to add student')
    } finally {
      setSavingStudent(false)
    }
  }

  return (
    <DropdownProvider>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-5 sm:mt-10">
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Class & Date</div>
        <div className="mt-1 text-sm text-slate-600">
          Select a class and subject to view summary cards.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
          <AdvancedDropdown
            label="Department"
            value={selection.department}
            onChange={handleDepartmentChange}
            options={DEPARTMENTS}
            placeholder="Select Department"
            helperText="Only CME is available"
          />
          
          <AdvancedDropdown
            label="Semester"
            value={selection.year}
            onChange={handleSemesterChange}
            options={SEMESTERS}
            placeholder="Select Semester"
            disabled={!selection.department || selection.department !== 'cme'}
            helperText={!selection.department ? "Select department first" : "Select semester"}
          />
          
          <AdvancedDropdown
            label="Shift"
            value={selection.section}
            onChange={handleShiftChange}
            options={SHIFTS}
            placeholder="Select Shift"
            helperText="Select class shift"
          />
          
          <AdvancedDropdown
            label="Subject"
            value={selection.subject}
            onChange={handleSubjectChange}
            options={subjectOptions}
            placeholder="Select Subject"
            disabled={!selection.year || selection.department !== 'cme'}
            helperText={!selection.year ? "Select semester first" : "Available subjects for CME"}
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
          value={loading ? '…' : summary ? `${summary.todaysAttendance.present}/${summary.todaysAttendance.totalMarked}` : '-'}
          sub="Present / Marked"
          icon={
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Card
          title="Monthly Average"
          value={loading ? '…' : summary ? `${summary.monthlyAverage}%` : '-'}
          sub="Current month (subject-wise)"
          icon={
            <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Student Management</div>
        <div className="mt-1 text-sm text-slate-600">Add students to the system.</div>

        <form onSubmit={onAddStudent} id="student-form" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={studentForm.rollNo}
            onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
            className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            placeholder="Roll No"
            required
          />
          <input
            value={studentForm.name}
            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
            className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            placeholder="Name"
            required
          />
          <input
            value={studentForm.department}
            onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
            className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            placeholder="Department"
            required
          />
          <input
            value={studentForm.year}
            onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
            className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            placeholder="Year"
            required
          />
          <input
            value={studentForm.section}
            onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
            className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            placeholder="Section"
            required
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
    </motion.div>
    </DropdownProvider>
  )
}

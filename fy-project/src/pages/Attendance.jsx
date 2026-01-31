import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, createContext, useContext, useRef } from 'react'
import { createPortal } from 'react-dom'

import { getStudents, markAttendance } from '../services/api'
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
  '1st sem': ['Maths', 'Physics', 'chemistry', 'English', 'C ', 'BCE'],
  '3rd sem': ['DSA', 'M2', 'DE', 'OS', 'DBMS'],
  '4th sem': ['SE', 'WT', 'COMP', 'Java', 'CN & CS'],
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
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7']

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

export default function Attendance() {
  const { selection, setSelection } = useClassSelection()

  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [absentees, setAbsentees] = useState('')
  const [presents, setPresents] = useState('')

  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingMark, setLoadingMark] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Dynamic subject options based on selected semester
  const subjectOptions = useMemo(() => {
    if (!selection.year || selection.department !== 'cme') return []
    return SUBJECTS_BY_SEMESTER[selection.year] || []
  }, [selection.year, selection.department])

  // Check if class is ready
  const classReady = useMemo(() => {
    return selection.department && selection.year && selection.section && selection.subject && selectedPeriod
  }, [selection, selectedPeriod])

  // Check if attendance can be marked
  const canMark = useMemo(() => {
    return classReady && date && (absentees.trim() || presents.trim())
  }, [classReady, date, absentees, presents])

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

  async function loadStudents() {
    if (!classReady) return
    setLoadingStudents(true)
    setError('')
    try {
      const { students: data } = await getStudents(selection)
      setStudents(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  async function markAttendance() {
    if (!canMark) return
    setLoadingMark(true)
    setError('')
    setMessage('')
    try {
      await markAttendance({
        ...selection,
        date,
        absentees: absentees.trim(),
        presents: presents.trim(),
        period: selectedPeriod
      })
      setMessage('Attendance marked successfully!')
      setAbsentees('')
      setPresents('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setLoadingMark(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [selection, selectedPeriod])

  return (
    <DropdownProvider>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-5 sm:mt-10">
      {/* Class Selection */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Class & Date Selection</div>
        <div className="mt-1 text-sm text-slate-600">
          Select class, subject, and date to mark attendance.
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
          
          <AdvancedDropdown
            label="Period Taught"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={PERIODS}
            placeholder="Select Period"
            helperText="Select period taught"
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
            <p className="text-xs text-slate-500 mt-1">Select attendance date</p>
          </div>
        </div>

        <button
          onClick={loadStudents}
          disabled={!classReady || loadingStudents}
          className="mt-4 rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        >
          {loadingStudents ? 'Loading...' : 'Load Students'}
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Attendance */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Mark Attendance</div>
        <div className="mt-1 text-sm text-slate-600">
          Enter absentees or presents (comma-separated roll numbers).
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-blue mb-2">Absentees</label>
            <textarea
              value={absentees}
              onChange={(e) => setAbsentees(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
              placeholder="e.g., 12, 18, 25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-blue mb-2">Presents</label>
            <textarea
              value={presents}
              onChange={(e) => setPresents(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
              placeholder="e.g., 1, 2, 3"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canMark || loadingMark}
            onClick={markAttendance}
            className="rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            {loadingMark ? 'Marking…' : 'Mark Attendance'}
          </motion.button>

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Students List */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-primary-blue">Students</div>
            <div className="mt-1 text-sm text-slate-600">Fetched by class selection.</div>
          </div>
          <div className="text-sm text-slate-600">{loadingStudents ? 'Loading…' : `${students.length} students`}</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="border-b border-blue-200 px-3 py-2">Roll No</th>
                <th className="border-b border-blue-200 px-3 py-2">Name</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="text-sm hover:bg-blue-50/50 transition-colors">
                  <td className="border-b border-blue-100 px-3 py-2 font-medium text-slate-900">
                    {s.rollNo}
                  </td>
                  <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{s.name}</td>
                </tr>
              ))}
              {!loadingStudents && students.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-sm text-slate-500 text-center">
                    Select department, year, and section to load students.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
    </DropdownProvider>
  )
}

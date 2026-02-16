import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { getMonthlyReport, downloadMonthlyExcel } from '../services/api'
import { useClassSelection } from '../context/ClassContext'

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

export default function Reports() {
  const { selection, setSelection } = useClassSelection()

  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  })

  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  // Dynamic subject options based on selected semester
  const subjectOptions = useMemo(() => {
    if (!selection.year || selection.department !== 'cme') return []
    return SUBJECTS_BY_SEMESTER[selection.year] || []
  }, [selection.year, selection.department])

  // Check if can load report
  const canLoad = useMemo(
    () => Boolean(
      selection.department === 'cme' && 
      selection.year && 
      selection.section &&
      selection.subject &&
      month
    ),
    [selection, month]
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

  async function onLoad() {
    if (!canLoad) return
    setLoading(true)
    setError('')
    try {
      const data = await getMonthlyReport({ ...selection, month })
      setReport(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  async function onDownload() {
    if (!canLoad) return
    setDownloading(true)
    try {
      await downloadMonthlyExcel({ ...selection, month })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download report')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-5 sm:mt-10">
      {/* Report Selection */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Monthly Attendance Report</div>
        <div className="mt-1 text-sm text-slate-600">
          Select class, subject, and month to generate attendance reports.
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
            disabled={!selection.year || selection.department !== 'cme'}
            helperText={!selection.year ? "Select semester first" : "Available subjects for CME"}
          />
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">Select report month</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canLoad || loading}
            onClick={onLoad}
            className="rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canLoad || downloading || !report}
            onClick={onDownload}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download Excel'}
          </motion.button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-primary-blue">Attendance Summary</div>
              <div className="mt-1 text-sm text-slate-600">
                Monthly attendance report for {month}
              </div>
            </div>
            <div className="text-sm text-slate-600">{report.length} students</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-blue-200 px-3 py-2">Roll No</th>
                  <th className="border-b border-blue-200 px-3 py-2">Name</th>
                  <th className="border-b border-blue-200 px-3 py-2">Working Days</th>
                  <th className="border-b border-blue-200 px-3 py-2">Present</th>
                  <th className="border-b border-blue-200 px-3 py-2">Absent</th>
                  <th className="border-b border-blue-200 px-3 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {report.map((student, index) => (
                  <tr key={index} className="text-sm hover:bg-blue-50/50 transition-colors">
                    <td className="border-b border-blue-100 px-3 py-2 font-medium text-slate-900">
                      {student.rollNo}
                    </td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.name}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.workingDays}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.present}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.absent}</td>
                    <td className="border-b border-blue-100 px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${student.percentage >= 75 ? 'bg-green-100 text-green-800' : student.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}

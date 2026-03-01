import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { getMonthlyReport, downloadMonthlyExcel, getWeeklyRegister, downloadWeeklyExcel } from '../services/api'
import { useClassSelection } from '../context/ClassContext'
import { AlertCircle, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'

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
  '1st sem': ['Maths', 'Physics', 'chemistry', 'English', 'C ', 'BCE'],
  '3rd sem': ['DSA', 'M2', 'DE', 'OS', 'DBMS'],
  '4th sem': ['SE', 'WT', 'COMP', 'Java', 'CN & CS'],
  '5th sem': ['IME', 'BD & CC', 'AP', 'IoT', 'Python']
}

// Convert frontend semester to backend format
const SEMESTER_MAP = {
  '1st sem': '1st semester',
  '3rd sem': '3rd semester', 
  '4th sem': '4th semester',
  '5th sem': '5th semester'
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

export default function Reports() {
  const { selection, setSelection } = useClassSelection()

  const [month, setMonth] = useState(() => {
    // Set to latest month with available data (January 2026)
    return '2026-01'
  })

  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [message, setMessage] = useState('')
  const [messageTimeout, setMessageTimeout] = useState(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout)
      }
    }
  }, [messageTimeout])

  // Weekly register states
  const [weekStart, setWeekStart] = useState(() => {
    // Set to current week's Monday
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    return monday.toISOString().slice(0, 10)
  })
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyError, setWeeklyError] = useState('')
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [weeklyDownloading, setWeeklyDownloading] = useState(false)

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

  // Check if can load weekly register
  const canLoadWeekly = useMemo(
    () => Boolean(
      selection.department &&
      selection.year &&
      selection.section &&
      weekStart
    ),
    [selection, weekStart]
  )

  // Validate if selected month is future or present working month
  const isInvalidMonth = useMemo(() => {
    if (!month) return false
    
    const selectedDate = new Date(month)
    const today = new Date()
    
    // Get current month and year
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Get selected month and year
    const selectedMonth = selectedDate.getMonth()
    const selectedYear = selectedDate.getFullYear()
    
    // Check if selected month is future
    if (selectedYear > currentYear) return true
    if (selectedYear === currentYear && selectedMonth > currentMonth) return true
    
    // Check if selected month is present working month (current month)
    if (selectedYear === currentYear && selectedMonth === currentMonth) return true
    
    return false
  }, [month])

  // Message helper function
  const setMessageWithTimeout = (message, duration = 3000) => {
    // Clear existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout)
    }
    
    setMessage(message)
    
    if (message) {
      const timeout = setTimeout(() => {
        setMessage('')
      }, duration)
      setMessageTimeout(timeout)
    }
  }

  // Validate if selected week is completed or still working
  const isWeekIncomplete = useMemo(() => {
    if (!weekStart) return false
    const selectedDate = new Date(weekStart)
    const today = new Date()
    
    // Get selected week's Sunday (end of selected week)
    const selectedWeekSunday = new Date(selectedDate)
    selectedWeekSunday.setDate(selectedDate.getDate() + 6)
    
    // Check if selected week is still ongoing or in future
    // Week is incomplete if Sunday >= today (week hasn't ended yet)
    return selectedWeekSunday >= today
  }, [weekStart])

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
    
    // Check if selected month is future or present working month
    if (isInvalidMonth) {
      setMessageWithTimeout('Please select a proper month')
      return
    }
    
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

  async function onLoadWeekly() {
    if (!canLoadWeekly) return
    
    // Check if selected week is incomplete (still working or future)
    if (isWeekIncomplete) {
      setMessageWithTimeout('Please select a completed week')
      return
    }
    
    setWeeklyLoading(true)
    setWeeklyError('')
    try {
      const data = await getWeeklyRegister({ ...selection, weekStart })
      setWeeklyReport(data)
    } catch (err) {
      setWeeklyError(err?.response?.data?.message || 'Failed to load weekly register')
    } finally {
      setWeeklyLoading(false)
    }
  }

  async function onDownloadWeekly() {
    if (!canLoadWeekly) return
    setWeeklyDownloading(true)
    try {
      const response = await downloadWeeklyExcel({ ...selection, weekStart })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selection.subject}_${weekStart}_weekly_register.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      setWeeklyError(err?.response?.data?.message || 'Failed to download weekly register')
    } finally {
      setWeeklyDownloading(false)
    }
  }

  async function onDownload() {
    if (!canLoad) return
    setDownloading(true)
    try {
      const response = await downloadMonthlyExcel({ ...selection, month })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selection.subject}_${month}_attendance_report.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to download report')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Toast Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center max-w-[95vw] sm:max-w-xl ${
            message.includes('proper') || message.includes('completed') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {message.includes('proper') || message.includes('completed') ? (
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          )}
          <span className="text-base sm:text-lg font-medium truncate">{message}</span>
        </motion.div>
      )}

      {/* Report Selection */}
      <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Monthly Attendance Report</div>
        <div className="mt-1 text-sm text-slate-600">
          Select class, subject, and month to generate attendance reports.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 overflow-visible">
          <SimpleDropdown
            label="Department"
            value={selection.department}
            onChange={handleDepartmentChange}
            options={DEPARTMENTS}
            placeholder="Select Department"
            
          />
          
          <SimpleDropdown
            label="Semester"
            value={selection.year}
            onChange={handleSemesterChange}
            options={SEMESTERS}
            placeholder="Select Semester"
            disabled={!selection.department || selection.department !== 'cme'}
            
          />
          
          <SimpleDropdown
            label="Shift"
            value={selection.section}
            onChange={handleShiftChange}
            options={SHIFTS}
            placeholder="Select Shift"
            
          />
          
          <SimpleDropdown
            label="Subject"
            value={selection.subject}
            onChange={handleSubjectChange}
            options={subjectOptions}
            placeholder="Select Subject"
            disabled={!selection.year || selection.department !== 'cme'}
            
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
        <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-primary-blue">Attendance Summary</div>
              <div className="mt-1 text-sm text-slate-600">
                Monthly attendance report for {report.subject} - {report.month}
              </div>
            </div>
            <div className="text-sm text-slate-600">{report.students?.length || 0} students • {report.totalPeriods || 0} total periods</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-blue-200 px-3 py-2">PIN</th>
                  <th className="border-b border-blue-200 px-3 py-2">Name</th>
                  <th className="border-b border-blue-200 px-3 py-2">Total Periods</th>
                  <th className="border-b border-blue-200 px-3 py-2">Periods Attended</th>
                  <th className="border-b border-blue-200 px-3 py-2">Periods Missed</th>
                  <th className="border-b border-blue-200 px-3 py-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {report.students?.map((student, index) => (
                  <tr key={index} className="text-sm hover:bg-blue-50/50 transition-colors">
                    <td className="border-b border-blue-100 px-3 py-2 font-medium text-slate-900">
                      {student.pin}
                    </td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.name}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.totalPeriods}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.presentPeriods}</td>
                    <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{student.absentPeriods}</td>
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

      {/* Weekly Register Section */}
      <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Weekly Attendance Register</div>
        <div className="mt-1 text-sm text-slate-600">
          Generate attendance register in book format for a specific week (Monday to Saturday).
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Week Start Date
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canLoadWeekly || weeklyLoading}
            onClick={onLoadWeekly}
            className="rounded-xl bg-primary-blue px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            {weeklyLoading ? 'Loading...' : 'Generate Weekly Register'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canLoadWeekly || weeklyDownloading || !weeklyReport}
            onClick={onDownloadWeekly}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
          >
            {weeklyDownloading ? 'Downloading...' : 'Download Excel'}
          </motion.button>

          {weeklyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {weeklyError}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Register Results */}
      {weeklyReport && (
        <div className="rounded-2xl border border-blue-200 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-base font-semibold text-primary-blue">Weekly Attendance Register</div>
              <div className="mt-1 text-sm text-slate-600">
                Weekly attendance register for all subjects • {weeklyReport.weekStart} to {weeklyReport.weekEnd}
              </div>
            </div>
            <div className="text-sm text-slate-600">{weeklyReport.students?.length || 0} students</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="text-left font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-blue-200 border-r border-blue-200 px-4 py-3 bg-blue-50 w-32">PIN</th>
                  <th className="border-b border-blue-200 border-r border-blue-200 px-4 py-3 bg-blue-50 w-48">Name</th>
                  {weeklyReport.weekDates.map((date, index) => (
                    <th key={index} colSpan="7" className="border-b border-blue-200 border-r border-blue-200 px-2 py-2 bg-blue-50 text-center">
                      <div>{date.formatted}</div>
                      <div className="font-normal">{date.day}</div>
                    </th>
                  ))}
                </tr>
                <tr className="text-left font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-blue-200 border-r border-blue-200 px-4 py-2 bg-blue-50 w-32"></th>
                  <th className="border-b border-blue-200 border-r border-blue-200 px-4 py-2 bg-blue-50 w-48"></th>
                  {weeklyReport.weekDates.map((date, dateIndex) => (
                    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map((period, periodIndex) => (
                      <th key={`${dateIndex}-${periodIndex}`} className="border-b border-blue-200 border-r border-blue-200 px-2 py-2 bg-blue-50 text-center">
                        {period}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyReport.students?.map((student) => (
                  <tr key={student.pin} className="hover:bg-blue-50/50 transition-colors">
                    <td className="border-b border-blue-100 border-r border-blue-200 px-4 py-2 font-medium text-slate-900 bg-blue-50 w-32 whitespace-nowrap">
                      {student.pin}
                    </td>
                    <td className="border-b border-blue-100 border-r border-blue-200 px-4 py-2 text-slate-700 w-48 whitespace-nowrap">
                      {student.name}
                    </td>
                    {weeklyReport.weekDates.map((date, dateIndex) => (
                      ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map((period, periodIndex) => {
                        const isPresent = weeklyReport.registerData[date.date]?.[student.pin]?.[periodIndex]
                        return (
                          <td key={`${student.pin}-${dateIndex}-${periodIndex}`} className="border-b border-blue-100 border-r border-blue-200 px-2 py-2 text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-sm font-bold ${
                              isPresent ? '' : 'text-red-600 bg-red-100'
                            }`}>
                              {isPresent ? 'P' : 'A'}
                            </span>
                          </td>
                        )
                      })
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
    </>
  )
}

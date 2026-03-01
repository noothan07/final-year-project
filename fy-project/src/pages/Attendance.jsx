import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { getStudents, markAttendance as markAttendanceAPI, getClassAttendance, checkPeriodAttendanceOnly, modifyAttendance as modifyAttendanceAPI } from '../services/api'
import { useClassSelection } from '../context/ClassContext'
import PageHeader from '../components/PageHeader'

// Simple Dropdown Component
function SimpleDropdown({ label, value, onChange, options, placeholder, disabled = false, helperText = '' }) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white ${
          disabled ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-blue-200 bg-white/80 hover:border-blue-300'
        }`}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
    </div>
  )
}

// Frontend subject mapping for CME department
const SUBJECTS_BY_SEMESTER = {
  '1st semester': ['Maths', 'Physics', 'chemistry', 'English', 'C ', 'BCE'],
  '3rd semester': ['DSA', 'M2', 'DE', 'OS', 'DBMS'],
  '4th semester': ['SE', 'WT', 'COMP', 'Java', 'CN & CS'],
  '5th semester': ['IME', 'BD & CC', 'AP', 'IoT', 'Python']
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

const SEMESTERS = [
  { value: '1st semester', label: '1st Semester' },
  { value: '2nd semester', label: '2nd Semester' },
  { value: '3rd semester', label: '3rd Semester' },
  { value: '4th semester', label: '4th Semester' },
  { value: '5th semester', label: '5th Semester' },
  { value: '6th semester', label: '6th Semester' }
]
const SHIFTS = [
  { value: '1st shift', label: '1st Shift' },
  { value: '2nd shift', label: '2nd Shift' }
]
const PERIODS = [
  { value: 'Period 1', label: 'Period 1' },
  { value: 'Period 2', label: 'Period 2' },
  { value: 'Period 3', label: 'Period 3' },
  { value: 'Period 4', label: 'Period 4' },
  { value: 'Period 5', label: 'Period 5' },
  { value: 'Period 6', label: 'Period 6' },
  { value: 'Period 7', label: 'Period 7' }
]

export default function Attendance() {
  const { selection, setSelection } = useClassSelection()
  const [toast, setToast] = useState({ message: '', type: '', visible: false })
  const [modifyDialog, setModifyDialog] = useState({ show: false, existingData: null })
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [absentees, setAbsentees] = useState('')
  const [presents, setPresents] = useState('')
  const [attendanceMode, setAttendanceMode] = useState('')
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingMark, setLoadingMark] = useState(false)
  const [existingAttendance, setExistingAttendance] = useState(null)

  const showSuccess = (message) => {
    setToast({ message, type: 'success', visible: true })
    setTimeout(() => setToast({ ...toast, visible: false }), 3000)
  }

  const showError = (message) => {
    setToast({ message, type: 'error', visible: true })
    setTimeout(() => setToast({ ...toast, visible: false }), 3000)
  }

  // Dynamic subject options based on selected semester
  const subjectOptions = useMemo(() => {
    if (!selection.year || selection.department !== 'cme') return []
    const subjects = SUBJECTS_BY_SEMESTER[selection.year] || []
    return subjects.map(subject => ({ value: subject, label: subject }))
  }, [selection.year, selection.department])

  // Check if class is ready
  const classReady = useMemo(() => {
    return selection.department && selection.year && selection.section && selection.subject && selectedPeriod
  }, [selection, selectedPeriod])

  // Check if attendance can be marked
  const canMark = useMemo(() => {
    const result = classReady && date && (attendanceMode && (absentees.trim() || presents.trim()))
    console.log('🔍 canMark calculation:', {
      classReady,
      date,
      attendanceMode,
      absentees: absentees.trim(),
      presents: presents.trim(),
      result
    })
    return result
  }, [classReady, date, absentees, presents, attendanceMode])

  // Check if modify button should be shown - only when attendance exists for this period
  const canModify = useMemo(() => {
    const result = classReady && date && selectedPeriod && existingAttendance
    console.log('🔍 canModify calculation:', {
      classReady,
      date,
      selectedPeriod,
      existingAttendance,
      result
    })
    return result
  }, [classReady, date, selectedPeriod, existingAttendance])

  // Check for existing attendance when period or date changes
  useEffect(() => {
    const checkAttendance = async () => {
      console.log('🔍 useEffect triggered - checking attendance for:', {
        classReady,
        date,
        selectedPeriod,
        department: selection.department,
        semester: selection.year,
        shift: selection.section,
        subject: selection.subject
      })
      
      if (classReady && date && selectedPeriod) {
        try {
          // Create params for period-only check (exclude subject)
          const params = {
            department: selection.department,
            semester: selection.year,
            shift: selection.section,
            subject: selection.subject,
            date,
            period: selectedPeriod
          }
          
          console.log('🔍 Using checkPeriodAttendanceOnly API (EXPLICIT PERIOD-ONLY):', params)
          const existingRecord = await checkPeriodAttendanceOnly(params)
          console.log('🔍 Found ANY record for period', selectedPeriod, '(any subject):', existingRecord)
          
          setExistingAttendance(existingRecord)
        } catch (err) {
          console.error('❌ Error checking existing attendance:', err)
          setExistingAttendance(null)
        }
      }
    }

    checkAttendance()
  }, [classReady, date, selectedPeriod, selection.department, selection.year, selection.section, selection.subject])

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
    // Clear attendance fields when subject changes
    setAbsentees('')
    setPresents('')
    setAttendanceMode('')
  }

  // Handle date change with validation
  const handleDateChange = (value) => {
    const selectedDate = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate > today) {
      showError('Cannot select future dates for attendance')
      return
    }
    setDate(value)
  }

  // Handle absentees change
  const handleAbsenteesChange = (value) => {
    console.log('🔍 Absentees input changed! Raw value:', JSON.stringify(value))
    console.log('🔍 Absentees input changed! Trimmed value:', JSON.stringify(value.trim()))
    setAbsentees(value)
    if (value.trim()) {
      setAttendanceMode('absentees')
      setPresents('') // Clear presents when entering absentees
      console.log('🔍 Set attendanceMode to absentees')
    } else {
      setAttendanceMode('')
      console.log('🔍 Set attendanceMode to empty')
    }
  }

  // Handle presents change
  const handlePresentsChange = (value) => {
    console.log('🔍 Presents input changed! Raw value:', JSON.stringify(value))
    console.log('🔍 Presents input changed! Trimmed value:', JSON.stringify(value.trim()))
    setPresents(value)
    if (value.trim()) {
      setAttendanceMode('presents')
      setAbsentees('') // Clear absentees when entering presents
      console.log('🔍 Set attendanceMode to presents')
    } else {
      setAttendanceMode('')
      console.log('🔍 Set attendanceMode to empty')
    }
  }

  // Handle period change
  const handlePeriodChange = (value) => {
    setSelectedPeriod(value)
    // Clear attendance fields when period changes
    setAbsentees('')
    setPresents('')
    setAttendanceMode('')
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
    
    // Clear any existing success/error messages when loading students for new period
    clearAttendanceFields()
    
    // Debug: Log the selection object
    console.log('🔍 Loading students with selection:', selection)
    
    // Map frontend selection to backend query params
    const params = {
      department: selection.department,
      semester: selection.year, // frontend stores semester in selection.year
      shift: selection.section  // frontend stores shift in selection.section
    }
    
    console.log('🔍 Loading students with params:', params)
    
    try {
      const { students: data } = await getStudents(params)
      console.log('📊 Received data from API:', data)
      
      setStudents(data || [])
      
      // Show "No data found" if no students match
      if (!data || data.length === 0) {
        showError('No students found matching the selected criteria')
      }
      
      // After loading students, check for existing attendance
      if (classReady && date && selectedPeriod) {
        console.log('🔍 Checking existing attendance after loading students (EXPLICIT PERIOD-ONLY)')
        try {
          // Create params for period-only check (exclude subject)
          const attendanceParams = {
            department: selection.department,
            semester: selection.year,
            shift: selection.section,
            date,
            period: selectedPeriod
          }
          
          console.log('🔍 Using checkPeriodAttendanceOnly after loading students (EXPLICIT PERIOD-ONLY):', attendanceParams)
          const existingRecord = await checkPeriodAttendanceOnly(attendanceParams)
          console.log('🔍 Setting existingAttendance after loading students (EXPLICIT PERIOD-ONLY):', existingRecord)
          setExistingAttendance(existingRecord)
        } catch (err) {
          console.error('❌ Error checking existing attendance after loading students:', err)
          setExistingAttendance(null)
        }
      }
    } catch (err) {
      console.error('❌ Error loading students:', err)
      showError(err?.response?.data?.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Clear students when dropdown values change
  useEffect(() => {
    setStudents([])
  }, [selection.department, selection.year, selection.section, selection.subject, selectedPeriod])

  // Remove automatic loading - only load when button is clicked
  // useEffect(() => {
  //   // Only load students when class is ready (all required fields selected)
  //   if (classReady) {
  //     loadStudents()
  //   }
  // }, [selection.department, selection.year, selection.section, selection.subject, selectedPeriod])

  // Remove duplicate useEffect
  // useEffect(() => {
  //   loadStudents()
  // }, [selection, selectedPeriod])

  // Clear attendance fields
  const clearAttendanceFields = () => {
    setAbsentees('')
    setPresents('')
    setAttendanceMode('')
  }

  const openModifyDialog = async () => {
    if (!canModify) {
      console.log('❌ Cannot open dialog - canModify is false')
      return
    }
    
    console.log('🔍 Opening modify dialog with existingAttendance state:', existingAttendance)
    
    // Use existingAttendance state directly instead of calling API again
    if (existingAttendance) {
      // Convert full PINs to short PINs for display
      const getShortPins = (pinString) => {
        if (!pinString) return ''
        return pinString.split(',').map(pin => {
          const trimmedPin = pin.trim()
          return trimmedPin.slice(-3).padStart(3, '0') // Take last 3 digits, pad with zeros
        }).join(', ')
      }
      
      const existingDataWithShortPins = {
        ...existingAttendance,
        absentees: getShortPins(existingAttendance.absentees),
        presents: getShortPins(existingAttendance.presents)
      }
      setModifyDialog({ show: true, existingData: existingDataWithShortPins })
    } else {
      console.log('❌ No existing data found, cannot open dialog')
    }
  }

  const handleModify = async () => {
    try {
      console.log('🔍 handleModify called with modifyDialog:', modifyDialog)
      console.log('🔍 existingData:', modifyDialog.existingData)
      console.log('🔍 students available:', students.length)
      
      // Convert short PINs back to full PINs by matching with students
      const convertShortToFullPins = (shortPinString) => {
        if (!shortPinString) return ''
        
        const shortPins = shortPinString.split(',').map(pin => pin.trim()).filter(pin => pin)
        console.log('🔍 Converting short PINs:', shortPins)
        
        const fullPins = shortPins.map(shortPin => {
          // Find student with matching short PIN
          const student = students.find(s => s.shortPin === shortPin || s.pin?.slice(-3) === shortPin)
          console.log(`🔍 Short PIN ${shortPin} -> Student:`, student ? student.pin : 'NOT FOUND')
          return student ? student.pin : shortPin // fallback to short PIN if not found
        })
        
        return fullPins.join(', ')
      }
      
      const attendanceData = {
        department: selection.department,
        semester: selection.year,
        shift: selection.section,
        subject: modifyDialog.existingData?.subject || selection.subject,
        date,
        absentees: convertShortToFullPins(modifyDialog.existingData?.absentees || ''),
        presents: convertShortToFullPins(modifyDialog.existingData?.presents || ''),
        period: selectedPeriod
      }
      
      console.log('🔍 Final attendanceData to send:', attendanceData)
      console.log('🔍 Absentees converted:', convertShortToFullPins(modifyDialog.existingData?.absentees || ''))
      console.log('🔍 Presents converted:', convertShortToFullPins(modifyDialog.existingData?.presents || ''))
      
      await modifyAttendanceAPI(attendanceData)
      showSuccess('Attendance modified successfully!')
      setModifyDialog({ show: false, existingData: null })
      setAbsentees('')
      setPresents('')
      setAttendanceMode('')
      // Clear existingAttendance state after successful modification
      setExistingAttendance(null)
    } catch (err) {
      console.error('❌ Modify error:', err)
      showError(err?.response?.data?.message || 'Failed to modify attendance')
    } finally {
      setLoadingMark(false)
    }
  }

  async function checkExistingAttendance() {
    if (!classReady || !date || !selectedPeriod) return null
    
    try {
      const params = {
        department: selection.department,
        semester: selection.year,
        shift: selection.section,
        date,
        period: selectedPeriod
      }
      
      console.log('🔍 checkExistingAttendance using checkPeriodAttendanceOnly API:', params)
      const response = await checkPeriodAttendanceOnly(params)
      console.log('🔍 Full API response:', response)
      console.log('🔍 response.existingAttendance:', response.existingAttendance)
      console.log('🔍 response keys:', Object.keys(response))
      
      // Return the existing attendance data if found
      if (response.existingAttendance) {
        console.log('🔍 Found existing attendance:', response.existingAttendance)
        return response.existingAttendance
      }
      
      console.log('❌ No existingAttendance found in response')
      return null
    } catch (err) {
      console.error('❌ Error checking existing attendance:', err)
      return null
    }
  }

  async function markAttendance() {
    console.log('🔍 markAttendance called! Current state:', {
      canMark,
      existingAttendance,
      selectedPeriod,
      subject: selection.subject
    })
    
    if (!canMark) {
      console.log('🔍 markAttendance blocked - canMark is false')
      return
    }
    setLoadingMark(true)
    
    console.log('🔍 Mark Attendance button clicked')
    
    try {
      // Check if attendance already exists for this period
      const existingData = await checkExistingAttendance()
      console.log('🔍 Existing attendance data from checkExistingAttendance:', existingData)
      
      if (existingData) {
        console.log('🔍 Attendance exists - showing toast and blocking override')
        // Show toast message - don't allow override
        showError('Attendance already marked for this period. Use "Modify Attendance" button to make changes.')
        setLoadingMark(false)
        // Set existingAttendance state to enable modify button
        setExistingAttendance(existingData)
        return
      }
      
      console.log('🔍 No existing attendance - proceeding to mark new attendance')
      
      // No existing attendance - proceed normally
      const pinList = (absentees.trim() || presents.trim()).split(',').map(pin => pin.trim())
      console.log('🔍 Short PINs:', pinList)
      
      // Validate PINs - only show error when clicking Mark Attendance button
      const invalidPINs = pinList.filter(shortPin => {
        const student = students.find(s => s.shortPin === shortPin)
        return !student
      })
      
      if (invalidPINs.length > 0) {
        showError(`Invalid PINs: ${invalidPINs.join(', ')}`)
        return
      }
      
      const fullPinList = pinList.map(shortPin => {
        // Find student with this short PIN and get their full PIN
        const student = students.find(s => s.shortPin === shortPin)
        console.log(`🔍 Mapping ${shortPin} -> ${student ? student.pin : 'NOT FOUND'}`)
        return student ? student.pin : shortPin // fallback to shortPin if not found
      })
      
      const attendanceData = {
        department: selection.department,
        semester: selection.year, // Map year to semester
        shift: selection.section, // Map section to shift
        subject: selection.subject,
        date,
        absentees: attendanceMode === 'absentees' ? fullPinList.join(', ') : '',
        presents: attendanceMode === 'presents' ? fullPinList.join(', ') : '',
        period: selectedPeriod
      }
      
      console.log('🔍 Sending attendance data:', attendanceData)
      
      // Call the API function, not the local function
      const response = await markAttendanceAPI(attendanceData)
      showSuccess('Attendance marked successfully!')
      setAbsentees('')
      setPresents('')
      setAttendanceMode('')
    } catch (err) {
      console.error('❌ Attendance marking error:', err)
      showError(err?.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setLoadingMark(false)
    }
  }

  // Remove automatic loading - only load when button is clicked
  // useEffect(() => {
  //   loadStudents()
  // }, [selection, selectedPeriod])

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Class Selection */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Class & Date Selection</div>
        <div className="mt-1 text-sm text-slate-600">
          Select class, subject, and date to mark attendance.
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
          
          <SimpleDropdown
            label="Period Taught"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            options={PERIODS}
            placeholder="Select Period"
            helperText="Select the period you are teaching"
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
      </div>

      {/* Attendance */}
      <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue">Mark Attendance</div>
        <div className="mt-1 text-sm text-slate-600">
          Enter absentees OR presents (comma-separated short PINs like 001, 002, 003).
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-blue mb-2">Absentees</label>
            <textarea
              value={absentees}
              onChange={(e) => handleAbsenteesChange(e.target.value)}
              rows={3}
              disabled={attendanceMode === 'presents'}
              className={`w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white ${
                attendanceMode === 'presents' 
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}
              placeholder="e.g., 001, 002, 003"
            />
            {attendanceMode === 'presents' && (
              <p className="text-xs text-slate-500 mt-1">Clear presents field to mark absentees</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-blue mb-2">Presents</label>
            <textarea
              value={presents}
              onChange={(e) => handlePresentsChange(e.target.value)}
              rows={3}
              disabled={attendanceMode === 'absentees'}
              className={`w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white ${
                attendanceMode === 'absentees' 
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}
              placeholder="e.g., 001, 002, 003"
            />
            {attendanceMode === 'absentees' && (
              <p className="text-xs text-slate-500 mt-1">Clear absentees field to mark presents</p>
            )}
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

          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canModify}
            onClick={openModifyDialog}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-professional transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
          >
            Modify Attendance
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={clearAttendanceFields}
            className="rounded-xl border border-slate-300 bg-gray-200 px-4 py-2 text-sm font-medium text-slate-700  transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Clear Input
          </motion.button>
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
                <th className="border-b border-blue-200 px-3 py-2">PIN</th>
                <th className="border-b border-blue-200 px-3 py-2">Name</th>
                <th className="border-b border-blue-200 px-3 py-2">Semester</th>
                <th className="border-b border-blue-200 px-3 py-2">Shift</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="text-sm hover:bg-blue-50/50 transition-colors">
                  <td className="border-b border-blue-100 px-3 py-2 font-medium text-slate-900">
                    {s.pin}
                  </td>
                  <td className="border-b border-blue-100 px-3 py-2 text-slate-700">{s.name}</td>
                  <td className="border-b border-blue-100 px-3 py-2 text-slate-600">{s.semester}</td>
                  <td className="border-b border-blue-100 px-3 py-2 text-slate-600">{s.shift}</td>
                </tr>
              ))}
              {!loadingStudents && students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-slate-500 text-center">
                    Select department, semester, and shift to load students.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modify Attendance Dialog */}
      {modifyDialog.show && (
        <>
          {console.log('🔍 RENDERING MODIFY DIALOG - modifyDialog.show:', modifyDialog.show)}
          {console.log('🔍 RENDERING MODIFY DIALOG - modifyDialog.existingData:', modifyDialog.existingData)}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-xl"
          >
            <div className="text-center">
              <div className="mb-4">
                
                <h3 className="text-lg font-semibold text-gray-900 mt-2">Modify Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">Update attendance for this period</p>
              </div>

              {/* Read-only Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={modifyDialog.existingData?.subject || selection.subject || 'N/A'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                    
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="text"
                      value={date}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Period</label>
                    <input
                      type="text"
                      value={selectedPeriod}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Attendance</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Absentees</label>
                    <textarea
                      value={modifyDialog.existingData?.absentees || ''}
                      onChange={(e) => setModifyDialog(prev => ({
                        ...prev,
                        existingData: { ...prev.existingData, absentees: e.target.value, presents: '' }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter PINs of absent students"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Presents</label>
                    <textarea
                      value={modifyDialog.existingData?.presents || ''}
                      onChange={(e) => setModifyDialog(prev => ({
                        ...prev,
                        existingData: { ...prev.existingData, presents: e.target.value, absentees: '' }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter PINs of present students"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setModifyDialog({ show: false, existingData: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModify}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </>
      )}

      {/* Local Toast Component */}
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-lg border shadow-lg max-w-sm ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-xs font-medium whitespace-nowrap">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
    </>
  )
}

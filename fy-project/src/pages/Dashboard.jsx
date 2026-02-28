import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { getDashboardSummary, getSubjectWiseSummary, getClassAttendance, getMonthlySummary, getWeeklySummary, getTodaySummary, getSubjectSummary, getPeriodAnalysis } from '../services/api'
import { useClassSelection } from '../context/ClassContext'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import { 
  MonthlyAttendanceTrend, 
  WeeklyAttendanceTrend, 
  TodayAttendanceOverview, 
  SubjectWisePerformance,
  PeriodAttendanceHeatmap 
} from '../components/DashboardCharts'

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
      className="rounded-2xl border bg-white border-blue-200 p-6"
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

  
  // Attendance viewing state
  const [attendanceDate, setAttendanceDate] = useState('')
  const [attendanceSubject, setAttendanceSubject] = useState('')
  const [attendanceData, setAttendanceData] = useState({})
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Chart data state
  const [chartData, setChartData] = useState({
    monthly: [],
    weekly: [],
    today: [],
    subject: [],
    periodAnalysis: []
  })
  const [chartsLoading, setChartsLoading] = useState(false)

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

  // Load chart data when selection changes
  useEffect(() => {
    if (selection.department && selection.year && selection.section) {
      loadChartData()
    }
  }, [selection.department, selection.year, selection.section])

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
    if (!canLoad) {
      return
    }
    
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
      } else {
        setSummary(null)
        setError(`No attendance data found for ${selection.subject} on ${date}`)
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
      
    } finally {
      setLoading(false)
    }
  }





  // Function to load attendance data for students
  async function loadAttendanceData() {
    if (!selection.department || !selection.year || !selection.section || !selection.subject) {
      return // Don't show error, just return silently
    }
    
    setLoadingAttendance(true)
    
    try {
      // Use selected date from main date input
      const dateToUse = date
      
      const params = {
        department: selection.department,
        semester: selection.year,
        shift: selection.section,
        date: dateToUse,
        subject: selection.subject
      }
      
      const response = await getClassAttendance(params)
      
      // Handle the actual backend response format
      if (response && response.attendance && response.attendance.presents && response.attendance.absentees) {
        // Backend returns: { attendance: { presents: [], absentees: [] } }
        const attendanceMap = {}
        
        // Mark all present students as 'present'
        response.attendance.presents.forEach(studentPin => {
          attendanceMap[studentPin] = 'present'
        })
        
        // Mark all absent students as 'absent'
        response.attendance.absentees.forEach(studentPin => {
          attendanceMap[studentPin] = 'absent'
        })
        
        setAttendanceData(attendanceMap)
        const presentCount = response.attendance.presents.length
        const absentCount = response.attendance.absentees.length
        
      } else if (response && response.attendance) {
        // Handle nested format: { attendance: { studentPin: { period: status } } }
        const attendanceMap = {}
        
        Object.keys(response.attendance).forEach(studentPin => {
          const studentAttendance = response.attendance[studentPin]
          const subjectAttendance = studentAttendance[selection.subject]
          
          if (subjectAttendance && typeof subjectAttendance === 'object') {
            // Find latest period number (highest key)
            const periods = Object.keys(subjectAttendance).filter(key => !isNaN(key)).map(Number)
            const latestPeriod = periods.length > 0 ? Math.max(...periods) : null
            
            if (latestPeriod !== null) {
              attendanceMap[studentPin] = subjectAttendance[latestPeriod.toString()]
            }
          } else if (subjectAttendance) {
            // Direct status (not period-based)
            attendanceMap[studentPin] = subjectAttendance
          }
        })
        
        setAttendanceData(attendanceMap)
        const presentCount = Object.values(attendanceMap).filter(status => status === 'present').length
        
      } else if (response && response.attendanceRecords) {
        // Old format: { attendanceRecords: [{ studentPin, status }] }
        const attendanceMap = {}
        response.attendanceRecords.forEach(record => {
          attendanceMap[record.studentPin] = record.status // 'present' or 'absent'
        })
        setAttendanceData(attendanceMap)
        const presentCount = Object.values(attendanceMap).filter(status => status === 'present').length
        
      } else {
        setAttendanceData({})
      }
    } catch (err) {
      // Keep UI stable and avoid breaking the dashboard
      setAttendanceData({})
    } finally {
      setLoadingAttendance(false)
    }
  }

  // Function to load all chart data
  async function loadChartData() {
    if (!selection.department || !selection.year || !selection.section) {
      return
    }

    setChartsLoading(true)
    
    try {
      const baseParams = {
        department: selection.department,
        semester: selection.year,
        shift: selection.section
      }

      // Load all chart data in parallel
      const [
        monthlyResponse,
        weeklyResponse,
        todayResponse,
        subjectResponse,
        periodAnalysisResponse
      ] = await Promise.all([
        getMonthlySummary(baseParams).catch((err) => {
          return { data: [] }
        }),
        getWeeklySummary(baseParams).catch((err) => {
          return { data: [] }
        }),
        getTodaySummary(baseParams).catch((err) => {
          return { data: [] }
        }),
        getSubjectSummary(baseParams).catch((err) => {
          return { data: [] }
        }),
        getPeriodAnalysis(baseParams).catch((err) => {
          return { data: [] }
        })
      ])

      // Process and set chart data
      setChartData({
        monthly: processMonthlyData(monthlyResponse.data || monthlyResponse || []),
        weekly: processWeeklyData(weeklyResponse.data || weeklyResponse || []),
        today: processTodayData(todayResponse.data || todayResponse || []),
        subject: processSubjectData(subjectResponse.data || subjectResponse || []),
        periodAnalysis: processPeriodAnalysisData(periodAnalysisResponse.data || periodAnalysisResponse || [])
      })

    } catch (err) {
      // Set empty data on error
      setChartData({
        monthly: [],
        weekly: [],
        today: [],
        subject: [],
        periodAnalysis: []
      })
    } finally {
      setChartsLoading(false)
    }
  }

  // Data processing functions
  const processMonthlyData = (data) => {
    if (!Array.isArray(data)) return []
    return data.map(item => ({
      month: item.month || 'Unknown',
      attendance: Math.round(item.attendance || 0)
    }))
  }

  const processWeeklyData = (data) => {
    if (!Array.isArray(data)) return []
    return data.map(item => ({
      day: item.day || 'Unknown',
      attendance: Math.round(item.attendance || 0)
    }))
  }

  const processTodayData = (data) => {
    if (!data || typeof data !== 'object') return []
    return [
      { name: 'Present', value: Math.round(data.present || 0) },
      { name: 'Absent', value: Math.round(data.absent || 0) }
    ]
  }

  const processSubjectData = (data) => {
    if (!Array.isArray(data)) return []
    return data.map(item => ({
      subject: item.subject || 'Unknown',
      attendance: Math.round(item.attendance || 0)
    }))
  }

  const processPeriodAnalysisData = (data) => {
    if (!Array.isArray(data)) return []
    return data.map(item => ({
      day: item.day || 'Unknown',
      period1: Math.round(item.period1 || 0),
      period2: Math.round(item.period2 || 0),
      period3: Math.round(item.period3 || 0),
      period4: Math.round(item.period4 || 0),
      period5: Math.round(item.period5 || 0),
      period6: Math.round(item.period6 || 0),
      period7: Math.round(item.period7 || 0)
    }))
  }










  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-2xl bg-white  p-6 border-blue-200 border">
        <div className="text-base font-semibold text-primary-blue">Class & Date</div>
        <div className="mt-1 text-sm text-slate-600">
          Select a class and subject to view summary cards.
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
            disabled={!selection.year}
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

      {/* Charts Section */}
      <div className="space-y-6"> 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthlyAttendanceTrend data={chartData.monthly} loading={chartsLoading} />
          <WeeklyAttendanceTrend data={chartData.weekly} loading={chartsLoading} />
          <TodayAttendanceOverview data={chartData.today} loading={chartsLoading} />
          <SubjectWisePerformance data={chartData.subject} loading={chartsLoading} />
          <div className="md:col-span-2">
            <PeriodAttendanceHeatmap data={chartData.periodAnalysis} loading={chartsLoading} />
          </div>
        </div>
      </div>
      
    </motion.div>
    </>
  )
}

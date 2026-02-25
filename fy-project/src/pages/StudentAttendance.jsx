import { useState } from 'react'
import { motion } from 'framer-motion'
import { getStudentAttendance, downloadStudentAttendanceExcel } from '../services/api'
import { useToast } from '../components/Toast'

export default function StudentAttendance() {
  const [pin, setPin] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState(null)
  
  const { success, error, ToastContainer } = useToast()

  const departments = ['cme','eee', 'mech', 'civil', 'automobile', 'architecture']
  const semesters = ['1st semester', '3rd semester', '4th semester', '5th semester']

  const handleSearch = async () => {
    if (!pin || !department || !semester) {
      error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const data = await getStudentAttendance(pin, department, semester)
      setAttendanceData(data)
      setShowResults(true)
      success('Attendance data loaded successfully')
    } catch (err) {
      console.error('Error fetching attendance:', err)
      error(err.response?.data?.error || 'Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintSummary = () => {
    const printContent = `
      <html>
        <head>
          <title>Attendance Summary - ${attendanceData?.student?.name || 'Student'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .student-info { margin-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary-item { text-align: center; }
            .monthly { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Summary Report</h1>
          </div>
          <div class="student-info">
            <p><strong>Name:</strong> ${attendanceData?.student?.name || 'N/A'}</p>
            <p><strong>PIN:</strong> ${attendanceData?.student?.pin || 'N/A'}</p>
            <p><strong>Department:</strong> ${attendanceData?.student?.department || 'N/A'}</p>
            <p><strong>Semester:</strong> ${attendanceData?.student?.semester || 'N/A'}</p>
            <p><strong>Shift:</strong> ${attendanceData?.student?.shift || 'N/A'}</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <h3>${attendanceData?.overallPercentage || 0}%</h3>
              <p>Overall Attendance</p>
            </div>
            <div class="summary-item">
              <h3>${attendanceData?.present || 0}</h3>
              <p>Classes Present</p>
            </div>
            <div class="summary-item">
              <h3>${attendanceData?.absent || 0}</h3>
              <p>Classes Absent</p>
            </div>
            <div class="summary-item">
              <h3>${attendanceData?.totalClasses || 0}</h3>
              <p>Total Classes</p>
            </div>
          </div>
          <div class="monthly">
            <h2>Monthly Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Present Days</th>
                  <th>Total Days</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceData?.monthlyBreakdown?.map(month => `
                  <tr>
                    <td>${month.month}</td>
                    <td>${month.presentDays}</td>
                    <td>${month.totalDays}</td>
                    <td>${month.percentage}%</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No data available</td></tr>'}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleDownloadExcel = async () => {
    if (!pin) return
    
    try {
      const response = await downloadStudentAttendanceExcel(pin)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendance_${pin}_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      success('Excel report downloaded successfully')
    } catch (err) {
      console.error('Error downloading Excel:', err)
      error('Failed to download Excel report')
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-slate-900">AttendMark - Student View</span>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Student Attendance View
          </h1>
          <p className="text-lg text-slate-600">
            View your attendance records without login
          </p>
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 inline-block">
            <p className="text-sm text-green-800">
              <strong>Read-Only Access:</strong> Students can only view attendance. No editing permissions.
            </p>
          </div>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Search Your Attendance</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Student PIN</label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="e.g 23010-CM-041"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option 
                    key={dept} 
                    value={dept}
                    disabled={dept !== 'cme'}
                    className={dept !== 'cme' ? 'text-slate-400' : ''}
                  >
                    {dept} {dept !== 'cme' ? '' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!pin || !department || !semester || loading}
                className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
              {/* Student Info Card */}
              {attendanceData?.student?.name && (
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left side - Name and Avatar */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {attendanceData.student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold text-slate-900 truncate">
                          {attendanceData.student.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {attendanceData.student.pin}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right side - Department and Semester */}
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm text-slate-600 truncate">
                          {attendanceData.student.department}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-slate-600 truncate">
                          {attendanceData.student.semester}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Attendance Summary</h3>
                </div>
                <div className="flex justify-center sm:justify-end">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Live Data</span>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{attendanceData?.overallPercentage || 0}%</div>
                  <div className="text-sm text-slate-600 mt-1">Overall Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{attendanceData?.present || 0}</div>
                  <div className="text-sm text-slate-600 mt-1">Classes Present</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">{attendanceData?.absent || 0}</div>
                  <div className="text-sm text-slate-600 mt-1">Classes Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-600">{attendanceData?.totalClasses || 0}</div>
                  <div className="text-sm text-slate-600 mt-1">Total Classes</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleDownloadExcel}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel Report
                </button>
                <button 
                  onClick={handlePrintSummary}
                  className="px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Print Summary
                </button>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Monthly Breakdown</h3>
              
              <div className="space-y-4">
                {attendanceData?.monthlyBreakdown?.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{month.month}</div>
                        <div className="text-sm text-slate-600">{month.presentDays}/{month.totalDays} days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {month.percentage}%
                      </div>
                      <div className="text-sm text-slate-600">Attendance</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-slate-500 py-8">
                    No monthly data available
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Student Access Information</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• This is a read-only view of your attendance records</li>
                    <li>• No login required for students to view attendance</li>
                    <li>• Attendance is updated in real-time by faculty</li>
                    <li>• Excel reports include detailed monthly breakdown</li>
                    <li>• Contact faculty for any attendance discrepancies</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}

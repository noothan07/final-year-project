import { useState } from 'react'
import { motion } from 'framer-motion'

export default function StudentAttendance() {
  const [rollNumber, setRollNumber] = useState('')
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [showResults, setShowResults] = useState(false)

  const departments = ['CME', 'MECH', 'CIVIL', 'AUTOMOBILE', 'ARCHITECTURE']
  const semesters = ['1st sem', '3rd sem', '4th sem', '5th sem']

  const handleSearch = () => {
    if (rollNumber && department && semester) {
      setShowResults(true)
    }
  }

  const mockData = {
    percentage: 87.5,
    present: 42,
    total: 48,
    absent: 6,
    monthlyData: [
      { month: 'January', present: 18, total: 20 },
      { month: 'February', present: 15, total: 18 },
      { month: 'March', present: 9, total: 10 }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-slate-900">AttendMark - Student View</span>
            </div>
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Home
            </a>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g., 21CME001"
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
                  <option key={dept} value={dept}>{dept}</option>
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
                disabled={!rollNumber || !department || !semester}
                className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Search
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
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Attendance Summary</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Live Data</span>
              </div>
              
              <div className="grid sm:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{mockData.percentage}%</div>
                  <div className="text-sm text-slate-600 mt-1">Overall Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{mockData.present}</div>
                  <div className="text-sm text-slate-600 mt-1">Classes Present</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">{mockData.absent}</div>
                  <div className="text-sm text-slate-600 mt-1">Classes Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-600">{mockData.total}</div>
                  <div className="text-sm text-slate-600 mt-1">Total Classes</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel Report
                </button>
                <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-colors">
                  Print Summary
                </button>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Monthly Breakdown</h3>
              
              <div className="space-y-4">
                {mockData.monthlyData.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{month.month}</div>
                        <div className="text-sm text-slate-600">{month.present}/{month.total} classes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {Math.round((month.present / month.total) * 100)}%
                      </div>
                      <div className="text-sm text-slate-600">Attendance</div>
                    </div>
                  </div>
                ))}
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
    </div>
  )
}

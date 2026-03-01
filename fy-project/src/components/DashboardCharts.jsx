import React, { memo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

// Monthly Attendance Trend Line Chart
const MonthlyAttendanceTrend = memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6">
        <div className="text-base font-semibold text-primary-blue mb-4">Monthly Attendance Trend</div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Monthly Attendance Trend</div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional"
    >
      <div className="text-base font-semibold text-primary-blue mb-4">Monthly Attendance Trend</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value) => [`${value}%`, 'Attendance']}
          />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
})

// Weekly Attendance Trend Area Chart
const WeeklyAttendanceTrend = memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Weekly Attendance Trend</div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Weekly Attendance Trend</div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional"
    >
      <div className="text-base font-semibold text-primary-blue mb-4">Weekly Attendance Trend</div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value) => [`${value}%`, 'Attendance']}
          />
          <Area 
            type="monotone" 
            dataKey="attendance" 
            stroke="#10b981" 
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
})

// Today's Attendance Overview Pie Chart
const TodayAttendanceOverview = memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Today's Attendance Overview</div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Today's Attendance Overview</div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const COLORS = ['#10b981', '#ef4444']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional"
    >
      <div className="text-base font-semibold text-primary-blue mb-4">Today's Attendance Overview</div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
})

// Subject-wise Performance Bar Chart
const SubjectWisePerformance = memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6">
        <div className="text-base font-semibold text-primary-blue mb-4">Subject-wise Performance</div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Subject-wise Performance</div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional"
    >
      <div className="text-base font-semibold text-primary-blue mb-4">Subject-wise Performance</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="subject" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value) => [`${value}%`, 'Attendance']}
          />
          <Bar 
            dataKey="attendance" 
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
})

// Period-wise Attendance Heatmap
const PeriodAttendanceHeatmap = memo(({ data, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Period-wise Attendance Analysis</div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional">
        <div className="text-base font-semibold text-primary-blue mb-4">Period-wise Attendance Analysis</div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  // Transform data for heatmap display
  const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getHeatmapColor = (attendance) => {
    if (attendance >= 90) return 'bg-green-500'
    if (attendance >= 75) return 'bg-blue-500'
    if (attendance >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-2xl bg-white border border-blue-200 p-6 shadow-professional"
    >
      <div className="text-base font-semibold text-primary-blue mb-4">Period-wise Attendance Analysis</div>
      
      <div className="space-y-2">
        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>90-100%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>75-89%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>60-74%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;60%</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-8 gap-1 text-xs">
          <div className="p-2"></div> {/* Empty corner */}
          {periods.map((period, index) => (
            <div key={period} className="p-2 text-center font-semibold text-gray-600">
              P{index + 1}
            </div>
          ))}
          
          {days.map((day) => (
            <React.Fragment key={day}>
              <div className="p-2 text-right font-semibold text-gray-600">{day}</div>
              {periods.map((period, periodIndex) => {
                const dayData = data.find(d => d.day === day)
                const attendance = dayData?.[`period${periodIndex + 1}`] || 0
                return (
                  <div
                    key={`${day}-${period}`}
                    className={`p-2 text-center text-white rounded ${getHeatmapColor(attendance)}`}
                    title={`${day} - ${period}: ${attendance}%`}
                  >
                    {attendance}%
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  )
})

export {
  MonthlyAttendanceTrend,
  WeeklyAttendanceTrend,
  TodayAttendanceOverview,
  SubjectWisePerformance,
  PeriodAttendanceHeatmap
}

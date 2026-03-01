import { motion } from 'framer-motion'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'w-full rounded-lg px-4 py-3 text-sm font-medium transition-all flex items-center space-x-3',
          isActive
            ? 'bg-primary-blue text-white shadow-professional'
            : 'text-slate-600 hover:bg-blue-50 hover:text-primary-blue',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Shell() {
  const { faculty, logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutDialog(false)
  }

  return (
    <div className="min-h-screen flex bg-linear-to-br from-blue-100 via-blue-50 to-indigo-50 sm:pt-15">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:border-r lg:border-blue-100 lg:bg-white/95 lg:backdrop-blur-md lg:shadow-lg">
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-blue">AttendMark</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-3 ">
          <NavItem to="/attendance">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Attendance</span>
          </NavItem>
          <NavItem to="/dashboard">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </NavItem>
          <NavItem to="/reports">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Reports</span>
          </NavItem>
          <NavItem to="/student-management">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Student Management</span>
          </NavItem>
          {faculty?.role === 'admin' && (
            <NavItem to="/staff">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Staff Management</span>
            </NavItem>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-blue-100 p-4 pb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {faculty?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary-blue truncate">
                {faculty?.name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {faculty?.email}
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogoutClick}
            className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:text-red-700"
          >
            Logout
          </motion.button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur-md sm:shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-5">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-lg font-bold text-primary-blue">AttendMark</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 ">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-primary-blue">{faculty?.name}</div>
              <div className="text-xs text-slate-500">{faculty?.email}</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogoutClick}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:text-red-700"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </header>

      {/* Fixed Mobile Navigation */}
      <nav className="fixed top-15 left-0 right-0 z-40 border-t border-blue-100 bg-white/95 backdrop-blur-md shadow-lg md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 px-2 py-3">

          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `flex-1 max-w-25 rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Attendance
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex-1 max-w-25 rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/student-management"
            className={({ isActive }) =>
              `flex-1 max-w-25 rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Students
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex-1 max-w-25 rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Reports
          </NavLink>

          {faculty?.role === 'admin' && (
            <NavLink
              to="/staff"
              className={({ isActive }) =>
                `flex-1 max-w-25 rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                  isActive
                    ? 'bg-primary-blue text-white shadow-md'
                    : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
                }`
              }
            >
              Staff
            </NavLink>
          )}

        </div>
      </nav>


      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64">
        <div className="pt-35 lg:pt-0 mx-auto w-full max-w-6xl px-4 sm:px-0 py-6">
          <Outlet />
        </div>
      </main>
      
      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout? You will need to login again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

import { motion } from 'framer-motion'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-lg px-3 py-2 text-sm font-medium transition-all',
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur-md sm:shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-5">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-lg font-bold text-primary-blue">Attendance System</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <NavItem to="/attendance">Attendance</NavItem>
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/reports">Reports</NavItem>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-primary-blue">{faculty?.name}</div>
              <div className="text-xs text-slate-500">{faculty?.email}</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={logout}
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
              `flex-1 max-w-[100px] rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
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
              `flex-1 max-w-[100px] rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex-1 max-w-[100px] rounded-lg px-3 py-2 text-xs font-medium text-center transition-all ${
                isActive
                  ? 'bg-primary-blue text-white shadow-md'
                  : 'bg-blue-50 text-slate-700 hover:bg-primary-blue hover:text-white'
              }`
            }
          >
            Reports
          </NavLink>

        </div>
      </nav>


      {/* Main Content Area */}
      <main className="flex-1 pt-16 md:pt-16 lg:pt-16">
        <div className="pt-16 md:pt-0 mx-auto w-full max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

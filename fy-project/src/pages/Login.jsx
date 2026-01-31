import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeWrapper from '../components/ThemeWrapper'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      console.log('Attempting login with:', { email, password })
      const result = await login(email, password)
      console.log('Login successful:', result)
      navigate('/') // Redirect to dashboard after successful login
    } catch (error) {
      console.error('Login error:', error)
      alert(`Login failed: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeWrapper>
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-sm p-8 shadow-professional-lg">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-primary-blue">Faculty Login</div>
              <div className="mt-2 text-sm text-slate-600">
                Sign in to mark attendance and generate reports
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary-blue mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                  placeholder="faculty@college.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-blue mb-2">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-sm  outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-professional transition-all hover:bg-blue-700 focus:outline-none  disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Attendance Marker System © 2026
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </ThemeWrapper>
  )
}

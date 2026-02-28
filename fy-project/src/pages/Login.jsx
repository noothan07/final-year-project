import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  function validateForm() {
    const newErrors = {}
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }
    
    return newErrors
  }

  async function onSubmit(e) {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    try {
      console.log('Attempting login with:', { email, password })
      const result = await login(email, password)
      console.log('Login successful:', result)
      navigate('/dashboard') // Redirect to dashboard after successful login
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different error scenarios
      let errorMessage = 'Login failed'
      
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 401) {
          errorMessage = data?.message || 'Invalid email or password'
        } else if (status === 404) {
          errorMessage = 'Email not registered. Please check your credentials.'
        } else if (status === 400) {
          errorMessage = data?.message || 'Invalid request. Please check your input.'
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.'
      }
      
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-blue-100">
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
              {/* General Error Message */}
              {errors.general && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-blue mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:bg-white ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                  }`}
                  placeholder="eg., faculty@college.edu"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-blue mb-2">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:bg-white ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                      : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                  }`}
                  placeholder="••••••••"
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
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
  )
}

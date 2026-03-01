// API Configuration for different environments
const API_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:5001',
    TIMEOUT: 10000
  },
  production: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
    TIMEOUT: 15000
  }
}

// Get current environment
const getEnvironment = () => {
  return import.meta.env.MODE || 'development'
}

// Get API config for current environment
export const getApiConfig = () => {
  const env = getEnvironment()
  return API_CONFIG[env]
}

// Export base URL for easy access
export const API_BASE_URL = getApiConfig().BASE_URL

// Common API headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  
  // Staff endpoints
  STAFF_LIST: '/api/staff',
  STAFF_REGISTER: '/api/staff/register',
  STAFF_DELETE: (employeeId) => `/api/staff/${employeeId}`,
  
  // Other endpoints
  ATTENDANCE: '/api/attendance',
  DASHBOARD: '/api/dashboard',
  REPORTS: '/api/reports',
  STUDENTS: '/api/students'
}

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const config = getApiConfig()
  const url = `${config.BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: getAuthHeaders(),
    timeout: config.TIMEOUT
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    const response = await fetch(url, finalOptions)
    
    // Handle common HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token')
        localStorage.removeItem('faculty')
        window.location.href = '/login'
        return
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.')
      }
      
      if (response.status === 404) {
        throw new Error('Resource not found.')
      }
      
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.')
      }
      
      // Handle other client errors
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.')
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.')
    }
    
    throw error
  }
}

export default API_CONFIG

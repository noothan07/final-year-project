import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Users, Trash2, Shield, AlertCircle, CheckCircle, X, Eye, EyeOff } from 'lucide-react'

export default function Staff() {
  const { faculty } = useAuth()
  const [staffList, setStaffList] = useState([])
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  })
  const [deleteData, setDeleteData] = useState({
    employeeId: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is admin
  if (!faculty || faculty.role !== 'admin') {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page. This area is restricted to administrators only.</p>
            <div className="w-full p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current role: <span className="font-medium text-gray-700">{faculty?.role || 'Unknown'}</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Fetch staff list on component mount
  useEffect(() => {
    fetchStaffList()
  }, [])

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5001/api/staff', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (error) {
      console.error('Error fetching staff list:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleDeleteInputChange = (e) => {
    const { name, value } = e.target
    setDeleteData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5001/api/staff/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          name: formData.name,
          email: formData.email,
          department: formData.department,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Staff registered successfully!')
        setFormData({
          employeeId: '',
          name: '',
          email: '',
          department: '',
          password: '',
          confirmPassword: ''
        })
        fetchStaffList() // Refresh staff list
      } else {
        setMessage(data.message || 'Error registering staff')
      }
    } catch (error) {
      setMessage('Error connecting to server. Please make sure the backend is running.')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (employeeId) => {
    if (!deleteData.password) {
      setMessage('Password is required for deletion')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5001/api/staff/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deleteData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Staff deleted successfully!')
        setDeleteData({ employeeId: '', password: '' })
        fetchStaffList() // Refresh staff list
      } else {
        setMessage(data.message || 'Error deleting staff')
      }
    } catch (error) {
      setMessage('Error deleting staff')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and register staff members</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Access</span>
                <span className="sm:hidden">Admin</span>
              </div>
            </div>
          </div>

          {/* Staff List Section */}
          {staffList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Existing Staff ({staffList.length})
                </h2>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <span className="hidden sm:inline">Employee ID</span>
                          <span className="sm:hidden">ID</span>
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <span className="hidden sm:inline">Role</span>
                          <span className="sm:hidden">R</span>
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffList.map((staff) => (
                        <tr key={staff._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="font-mono text-xs sm:text-sm">{staff.employeeId}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="sm:hidden">
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-xs text-gray-500">{staff.email}</div>
                            </div>
                            <span className="hidden sm:inline">{staff.name}</span>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {staff.email}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {staff.department}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => setDeleteData({ ...deleteData, employeeId: staff.employeeId })}
                              className="text-red-600 hover:text-red-900 font-medium flex items-center hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs sm:text-sm"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delete Confirmation Section */}
              {deleteData.employeeId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <h3 className="text-base sm:text-lg font-medium text-red-800 flex items-center">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="wrap-break-word">Delete Staff: {deleteData.employeeId}</span>
                    </h3>
                    <button
                      onClick={() => setDeleteData({ employeeId: '', password: '' })}
                      className="text-red-600 hover:text-red-800 self-start sm:self-auto"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-red-700 mb-4">This action cannot be undone. Please enter your admin password to confirm.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        name="password"
                        value={deleteData.password}
                        onChange={handleDeleteInputChange}
                        placeholder="Enter your admin password"
                        className="w-full px-3 py-2 pr-10 border border-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => handleDelete(deleteData.employeeId)}
                        disabled={isLoading}
                        className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center font-medium text-sm"
                      >
                        {isLoading ? (
                          <>Deleting...</>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteData({ employeeId: '', password: '' })}
                        className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Registration Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-6"
          >
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Register New Staff</h2>
            </div>
            
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center ${
                  message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.includes('success') ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                )}
                <span className="text-sm sm:text-base">{message}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                      errors.employeeId ? 'border-red-500 bg-red-50' : 'border-blue-200'
                    }`}
                    placeholder="e.g., EMP001"
                  />
                  {errors.employeeId && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-blue-200'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-blue-200'
                    }`}
                    placeholder="staff@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                      errors.department ? 'border-red-500 bg-red-50' : 'border-blue-200'
                    }`}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                    <option value="General">General</option>
                  </select>
                  {errors.department && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-blue-200'
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base ${
                        errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-blue-200'
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>Registering...</>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Register Staff
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

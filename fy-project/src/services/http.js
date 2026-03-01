import axios from 'axios'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem('token')
  } else {
    localStorage.setItem('token', token)
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
})

http.interceptors.request.use((config) => {
  console.log(
    'HTTP Request:',
    config.method?.toUpperCase(),
    config.url,
    config.data
  )

  const token = getToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    console.log('HTTP Response:', response.status, response.data)
    return response
  },
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // Handle validation-type errors
    if (status === 400 || status === 409) {
      console.warn('HTTP Error:', status, data)
    } else {
      console.error('HTTP Error:', status, data)
    }

    // Specific validation check
    if (
      data?.message?.includes(
        'These students are not in the selected class'
      )
    ) {
      console.log(
        '🔍 Found the validation error in HTTP interceptor!'
      )
    }

    return Promise.reject(error)
  }
)
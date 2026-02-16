import axios from 'axios'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (!token) localStorage.removeItem('token')
  else localStorage.setItem('token', token)
}

export const http = axios.create({
  baseURL: 'http://localhost:5000',
})

http.interceptors.request.use((config) => {
  console.log('HTTP Request:', config.method?.toUpperCase(), config.url, config.data)
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
    console.error('HTTP Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

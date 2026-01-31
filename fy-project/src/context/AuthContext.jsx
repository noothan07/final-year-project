import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { login as loginApi } from '../services/api'
import { getToken, setToken } from '../services/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [faculty, setFaculty] = useState(() => {
    const raw = localStorage.getItem('faculty')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    setToken(token)
    if (token) localStorage.setItem('token', token)
  }, [token])

  const value = useMemo(
    () => ({
      token,
      faculty,
      isAuthed: Boolean(token),
      async login(email, password) {
        const data = await loginApi(email, password)
        setTokenState(data.token)
        setFaculty(data.faculty)
        localStorage.setItem('faculty', JSON.stringify(data.faculty))
        return data
      },
      logout() {
        setTokenState(null)
        setFaculty(null)
        localStorage.removeItem('token')
        localStorage.removeItem('faculty')
        setToken(null)
      },
    }),
    [token, faculty]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

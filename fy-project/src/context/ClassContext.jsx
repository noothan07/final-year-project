import { createContext, useContext, useMemo, useState } from 'react'

const ClassContext = createContext(null)

const DEFAULTS = {
  department: '',
  year: '',
  section: '',
  subject: '',
}

export function ClassProvider({ children }) {
  const [selection, setSelection] = useState(() => {
    const raw = localStorage.getItem('classSelection')
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  })

  const value = useMemo(
    () => ({
      selection,
      setSelection(next) {
        setSelection((prev) => {
          const valueObj = typeof next === 'function' ? next(prev) : next
          localStorage.setItem('classSelection', JSON.stringify(valueObj))
          return valueObj
        })
      },
      clear() {
        localStorage.removeItem('classSelection')
        setSelection(DEFAULTS)
      },
    }),
    [selection]
  )

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
}

export function useClassSelection() {
  const ctx = useContext(ClassContext)
  if (!ctx) throw new Error('useClassSelection must be used within ClassProvider')
  return ctx
}

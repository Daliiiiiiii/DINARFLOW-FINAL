import { createContext, useContext, useEffect, useState } from 'react'

const DarkModeContext = createContext()

export const DarkModeProvider = ({ children }) => {
  // Check if user has a theme preference in localStorage or system preference
  const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPrefs = window.localStorage.getItem('color-theme')
      if (typeof storedPrefs === 'string') {
        return storedPrefs === 'dark'
      }

      const userMedia = window.matchMedia('(prefers-color-scheme: dark)')
      if (userMedia.matches) {
        return true
      }
    }

    return false // default to light mode
  }

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme())

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove(isDarkMode ? 'light' : 'dark')
    root.classList.add(isDarkMode ? 'dark' : 'light')
    
    // Save theme preference to localStorage
    localStorage.setItem('color-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}

export default DarkModeContext 
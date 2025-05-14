import { createContext, useContext, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import PropTypes from 'prop-types'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const lastNotification = useRef(null)
  const timeoutRef = useRef(null)

  const showNotification = useCallback((type, message, options = {}) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Check if this is the same notification as the last one
    const notificationKey = `${type}-${message}`
    if (lastNotification.current === notificationKey) {
      return
    }

    // Show the notification
    toast(message, {
      type,
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      ...options
    })

    // Update last notification
    lastNotification.current = notificationKey

    // Clear the last notification reference after a delay
    timeoutRef.current = setTimeout(() => {
      lastNotification.current = null
    }, 1000)
  }, [])

  const showSuccess = useCallback((message, options = {}) => {
    showNotification('success', message, {
      ...options,
      className: 'bg-green-500 text-white'
    })
  }, [showNotification])

  const showError = useCallback((message, options = {}) => {
    showNotification('error', message, {
      ...options,
      className: 'bg-red-500 text-white'
    })
  }, [showNotification])

  const showInfo = useCallback((message, options = {}) => {
    showNotification('info', message, {
      ...options,
      className: 'bg-blue-500 text-white'
    })
  }, [showNotification])

  const showWarning = useCallback((message, options = {}) => {
    showNotification('warning', message, {
      ...options,
      className: 'bg-yellow-500 text-white'
    })
  }, [showNotification])

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export default NotificationProvider 
import { createContext, useContext, useState, useCallback, useRef } from 'react'
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
  const [queue, setQueue] = useState([])
  const isProcessing = useRef(false)
  const processingTimeout = useRef(null)

  const processQueue = useCallback(() => {
    if (queue.length === 0 || isProcessing.current) return

    isProcessing.current = true
    const currentNotification = queue[0]

    try {
      toast(currentNotification.message, {
        type: currentNotification.type,
        position: 'top-right',
        autoClose: currentNotification.autoClose || 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        ...currentNotification.options
      })

      setQueue(prevQueue => prevQueue.slice(1))
    } catch (error) {
      console.error('Error processing notification:', error)
      // Remove the failed notification from the queue
      setQueue(prevQueue => prevQueue.slice(1))
    } finally {
      isProcessing.current = false
      // Process next notification after a short delay
      processingTimeout.current = setTimeout(() => {
        processQueue()
      }, 300)
    }
  }, [queue])

  const addNotification = useCallback((notification) => {
    setQueue(prevQueue => [...prevQueue, notification])
    // Start processing if not already processing
    if (!isProcessing.current) {
      processQueue()
    }
  }, [processQueue])

  const clearQueue = useCallback(() => {
    setQueue([])
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current)
    }
    isProcessing.current = false
  }, [])

  const showSuccess = useCallback((message, options = {}) => {
    addNotification({
      message,
      type: 'success',
      options: {
        ...options,
        className: 'bg-green-500 text-white'
      }
    })
  }, [addNotification])

  const showError = useCallback((message, options = {}) => {
    addNotification({
      message,
      type: 'error',
      options: {
        ...options,
        className: 'bg-red-500 text-white'
      }
    })
  }, [addNotification])

  const showInfo = useCallback((message, options = {}) => {
    addNotification({
      message,
      type: 'info',
      options: {
        ...options,
        className: 'bg-blue-500 text-white'
      }
    })
  }, [addNotification])

  const showWarning = useCallback((message, options = {}) => {
    addNotification({
      message,
      type: 'warning',
      options: {
        ...options,
        className: 'bg-yellow-500 text-white'
      }
    })
  }, [addNotification])

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearQueue,
    queue
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
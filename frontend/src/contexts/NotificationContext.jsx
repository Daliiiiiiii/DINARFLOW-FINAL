import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import PropTypes from 'prop-types'
import { useAuth } from './AuthContext'
import api from '../lib/axios'

const NotificationContext = createContext()

// Create notification sound
const notificationSound = new Audio('/sounds/notification.mp3')

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
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { userProfile } = useAuth()

  // Function to refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications');
      const notificationsArray = Array.isArray(response.data) ? response.data : (response.data.notifications || []);
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, []);

  // Function to play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      notificationSound.currentTime = 0
      notificationSound.play().catch(error => {
        console.error('Error playing notification sound:', error)
      })
    } catch (error) {
      console.error('Error with notification sound:', error)
    }
  }, [])

  // Function to show notification toast
  const showNotification = useCallback((type, title, options = {}) => {
    const { description } = options
    toast[type](description || title, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }, [])

  // Function to show success notification
  const showSuccess = useCallback((message) => {
    showNotification('success', message)
  }, [showNotification])

  // Function to show error notification
  const showError = useCallback((message) => {
    showNotification('error', message)
  }, [showNotification])

  useEffect(() => {
    if (!userProfile) return

    // Initial fetch of notifications
    refreshNotifications();

    // Listen for real-time notifications
    const handleNewNotification = (data) => {
      console.log('[DEBUG] Received notification:', data);
      const { notification } = data
      
      // Update notifications state
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Play notification sound
      playNotificationSound()
      
      // Only show toast for non-support notifications
      if (
        notification.title !== 'New Support Ticket' &&
        notification.title !== 'New Support Message'
      ) {
        showNotification('info', notification.title, {
          description: notification.message
        })
      }

      // Refresh notifications to ensure consistency
      refreshNotifications();
    }

    // Subscribe to notification events
    if (window.socket) {
      console.log('[DEBUG] Setting up notification listener');
      window.socket.on('notification:received', handleNewNotification);
    }

    return () => {
      if (window.socket) {
        console.log('[DEBUG] Cleaning up notification listener');
        window.socket.off('notification:received', handleNewNotification);
      }
    }
  }, [userProfile, playNotificationSound, showNotification, refreshNotifications])

  const value = {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    showNotification,
    showSuccess,
    showError,
    playNotificationSound,
    refreshNotifications
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
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  RiBellLine, 
  RiWalletLine, 
  RiShieldCheckLine, 
  RiShieldLine, 
  RiQuestionLine, 
  RiExternalLinkLine,
  RiVolumeUpLine,
  RiVolumeMuteLine,
  RiHistoryLine,
  RiCloseLine,
  RiCheckLine,
  RiCalendarLine,
  RiUser3Line,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiSunLine,
  RiNotificationLine
} from 'react-icons/ri'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getFileUrl } from '../../utils/urlUtils'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { typography } from '../../styles/typography'

// Custom notification sounds
const notificationSounds = {
  success: {
    audio: new Audio('/sounds/success.mp3'),
    icon: '🎉',
    volume: 0.7
  },
  error: {
    audio: new Audio('/sounds/error.mp3'),
    icon: '⚠️',
    volume: 0.9
  },
  info: {
    audio: new Audio('/sounds/info.mp3'),
    icon: 'ℹ️',
    volume: 0.5
  },
  warning: {
    audio: new Audio('/sounds/warning.mp3'),
    icon: '⚠️',
    volume: 0.8
  }
};

// Preload sounds and set volumes
Object.values(notificationSounds).forEach(({ audio, volume }) => {
  audio.load();
  audio.volume = volume;
});

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/wallet': 'My Wallet',
  '/transfer': 'Transfer Funds',
  '/bank-transfer': 'Bank Transfer',
  '/crypto': 'Cryptocurrency',
  '/history': 'Transaction History',
  '/profile': 'My Profile',
  '/settings': 'Account Settings'
}

// Date range presets
const datePresets = [
  {
    label: "Last 24 hours",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - 24);
      return [start, end];
    }
  },
  {
    label: "Last week",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return [start, end];
    }
  },
  {
    label: "Last month",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      return [start, end];
    }
  },
  {
    label: "Last 3 months",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return [start, end];
    }
  }
];

const Header = () => {
  const { userProfile, logout } = useAuth()
  const { queue: notifications, clearQueue } = useNotification()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [previousKycStatus, setPreviousKycStatus] = useState(userProfile?.kycStatus)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [showTimeSelect, setShowTimeSelect] = useState(false)
  const [customTimeRange, setCustomTimeRange] = useState({
    start: '00:00',
    end: '23:59'
  })
  const [isMuted, setIsMuted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Get current page title
  const currentTitle = pageTitles[location.pathname] || 'Dashboard'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate unread count from notifications queue
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Monitor KYC status changes
  useEffect(() => {
    if (userProfile?.kycStatus && userProfile.kycStatus !== previousKycStatus) {
      const statusConfig = {
        pending: {
          type: 'info',
          message: 'KYC verification is pending. Please submit your documents.',
          action: 'Submit Documents',
          sound: notificationSounds.info
        },
        in_progress: {
          type: 'info',
          message: 'Your KYC documents are under review.',
          action: 'View Status',
          sound: notificationSounds.info
        },
        verified: {
          type: 'success',
          message: 'Your KYC verification has been approved!',
          action: 'View Details',
          sound: notificationSounds.success
        },
        rejected: {
          type: 'error',
          message: 'Your KYC verification was rejected. Please check the reason and resubmit.',
          action: 'View Details',
          sound: notificationSounds.error
        }
      }

      const config = statusConfig[userProfile.kycStatus]
      
      if (!isMuted && config?.sound?.audio) {
        const sound = new Audio(config.sound.audio.src)
        sound.volume = config.sound.volume
        sound.play().catch(() => {
          // Ignore errors if sound can't play
        })
      }

      setPreviousKycStatus(userProfile.kycStatus)
    }
  }, [userProfile?.kycStatus, previousKycStatus, isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const getKycStatusBadge = () => {
    if (!userProfile) return null

    const statusConfig = {
      pending: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'Pending',
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      },
      in_progress: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'In Progress',
        className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      },
      verified: {
        icon: <RiShieldCheckLine className="w-5 h-5" />,
        text: 'Verified',
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      },
      rejected: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'Rejected',
        className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      }
    }

    const config = statusConfig[userProfile.kycStatus]
    if (!config) return null

    return (
      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </div>
    )
  }

  // Filter notifications based on current filter and date range
  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all' && notification.type !== filter) return false
    
    if (startDate && endDate) {
      const notificationDate = new Date(notification.timestamp)
      return notificationDate >= startDate && notificationDate <= endDate
    }
    
    return true
  })

  const handleClearAllFilters = () => {
    setFilter('all')
    setDateRange([null, null])
    setShowTimeSelect(false)
    setCustomTimeRange({
      start: '00:00',
      end: '23:59'
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      toast.error('Failed to logout. Please try again.')
    }
  }

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1]
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 ${
        scrolled ? 'shadow-md' : ''
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <h1 className={typography.h2}>{getPageTitle()}</h1>
          </div>
          
          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isDark ? (
                <RiSunLine className="w-6 h-6" />
              ) : (
                <RiMoonLine className="w-6 h-6" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <RiNotificationLine className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs font-medium text-white bg-primary-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    {/* Notifications content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <button
                          onClick={clearQueue}
                          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          Clear all
                        </button>
                      </div>
                      
                      {filteredNotifications.length > 0 ? (
                        <div className="space-y-4">
                          {filteredNotifications.map((notification, index) => (
                            <div 
                              key={index}
                              className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No notifications</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* KYC Status Badge */}
            {getKycStatusBadge()}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center focus:outline-none"
              >
                {userProfile?.profilePicture ? (
                  <img 
                    src={getFileUrl(userProfile.profilePicture)} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full ring-2 ring-transparent hover:ring-primary-500 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ring-2 ring-transparent hover:ring-primary-500 transition-all">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {userProfile?.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userProfile?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userProfile?.email}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile')
                          setProfileOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <RiUser3Line className="w-4 h-4 mr-3" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings')
                          setProfileOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <RiSettings4Line className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          toggleTheme()
                          setProfileOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {isDark ? (
                          <>
                            <RiSunLine className="w-4 h-4 mr-3" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <RiMoonLine className="w-4 h-4 mr-3" />
                            Dark Mode
                          </>
                        )}
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <RiLogoutBoxRLine className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
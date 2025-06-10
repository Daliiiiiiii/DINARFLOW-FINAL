import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Lock, 
  CreditCard, 
  Smartphone,
  Mail,
  AlertTriangle,
  X,
  ChevronRight,
  Shield,
  LogOut,
  Calendar,
  Check
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'react-toastify'
import PasswordUpdateForm from '../components/forms/PasswordUpdateForm'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'
import { format } from 'date-fns'
import ActionLoader from '../assets/animations/ActionLoader'
import api from '../lib/axios'
import { getImageUrl } from '../utils/urlUtils'
import ComingSoonOverlay from '../components/ui/ComingSoonOverlay'

const Settings = () => {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { userProfile, updateUserProfile, setUserProfile, logout } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showTwoFactorOverlay, setShowTwoFactorOverlay] = useState(false)
  const [showDeleteAccountOverlay, setShowDeleteAccountOverlay] = useState(false)
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    transactions: true,
    marketing: false,
    security: true
  })
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: userProfile?.twoFactorEnabled || false
  })
  
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [updatingNotifications, setUpdatingNotifications] = useState(false)
  const [updatingSecurity, setUpdatingSecurity] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en')
  
  const [isLoading, setIsLoading] = useState(false)
  
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  const handleSecurityChange = (e) => {
    const { name, checked } = e.target
    setSecurity(prev => ({
      ...prev,
      [name]: checked
    }))
  }
  
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language)
    i18n.changeLanguage(language).then(() => {
      localStorage.setItem('i18nextLng', language)
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
      toast.success(t('settings.language.success'))
    })
  }
  
  const saveNotificationSettings = async () => {
    try {
      setError('')
      setSuccess('')
      setUpdatingNotifications(true)
      
      await updateUserProfile({
        notificationsEnabled: notifications.email
      })
      
      setSuccess('Notification preferences updated successfully!')
    } catch (error) {
      setError('Failed to update notification settings: ' + error.message)
    } finally {
      setUpdatingNotifications(false)
      
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    }
  }
  
  const saveSecuritySettings = async () => {
    try {
      setError('')
      setSuccess('')
      setUpdatingSecurity(true)
      
      await updateUserProfile({
        twoFactorEnabled: security.twoFactorEnabled
      })
      
      setSuccess('Security settings updated successfully!')
    } catch (error) {
      setError('Failed to update security settings: ' + error.message)
    } finally {
      setUpdatingSecurity(false)
      
      setTimeout(() => {
        setSuccess('')
      }, 3000)
    }
  }
  
  const handleSessionsClick = () => {
    toast.info('Session management will be available soon.')
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action will be completed after a 14-day grace period, during which you can cancel the deletion request.'
    )

    if (!confirmDelete) return

    try {
      if (!userProfile) {
        toast.error('User profile not found.')
        return
      }

      const response = await api.post('/api/users/delete-account', { action: 'request' })
      toast.info(response.data.message)
      
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to request account deletion: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCancelDeletion = async () => {
    try {
      if (!userProfile) {
        setError('User profile not found.')
        return
      }

      const response = await api.post('/api/users/delete-account', { action: 'cancel' })

      // Update local state
      setUserProfile({
        ...userProfile,
        deletion_requested_at: null,
        account_status: 'active'
      })

      toast.success(response.data.message)
    } catch (error) {
      console.error('Cancel deletion error:', error)
      setError('Failed to cancel account deletion: ' + (error.response?.data?.error || error.message))
    }
  }

  const privacyPolicyContent = `
    Privacy Policy for DinarFlow

    1. Information We Collect
    We collect and process the following information:
    - Personal identification information (Name, email address, phone number)
    - Financial transaction data
    - KYC verification documents
    - Usage data and analytics

    2. How We Use Your Information
    Your information is used to:
    - Process transactions
    - Verify your identity
    - Provide customer support
    - Improve our services
    - Comply with legal requirements

    3. Data Security
    We implement strong security measures to protect your data:
    - End-to-end encryption for transactions
    - Secure storage of personal information
    - Regular security audits
    - Access controls and monitoring

    4. Your Rights
    You have the right to:
    - Access your personal data
    - Request data correction
    - Request data deletion
    - Withdraw consent
    - File a complaint

    5. Data Retention
    We retain your data for as long as necessary to:
    - Provide our services
    - Comply with legal obligations
    - Resolve disputes
    - Enforce agreements

    6. Third-Party Services
    We may use third-party services for:
    - Payment processing
    - Analytics
    - Customer support
    - Identity verification

    7. Updates to Privacy Policy
    We may update this policy periodically. Users will be notified of significant changes.

    8. Contact Information
    For privacy-related inquiries, contact us at privacy@dinarflow.com
  `
  
  const SettingSection = ({ icon: Icon, title, description, children }) => (
    <Card className="p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className={typography.h3}>{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          <div className="mt-4">
            {children}
          </div>
        </div>
      </div>
    </Card>
  )

  const Toggle = ({ label, name, checked, onChange, disabled }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        className={`${
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={() => !disabled && onChange({ target: { name, checked: !checked } })}
        disabled={disabled}
      >
        <span
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        >
          <span
            className={`${
              checked ? 'opacity-100' : 'opacity-0'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
          >
            <Check className="h-3 w-3 text-primary-600" />
          </span>
          <span
            className={`${
              checked ? 'opacity-0' : 'opacity-100'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
          >
            <X className="h-3 w-3 text-gray-400" />
          </span>
        </span>
      </button>
    </div>
  )
  
  if (isLoading) {
    return <ActionLoader isLoading={true} />;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('common.settings')}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.language.title')}</h2>
            <div className="space-y-4">
              <button 
                onClick={() => handleLanguageChange('ar')}
                className={`w-full p-4 rounded-lg ${
                  selectedLanguage === 'ar'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : isDark
                      ? 'bg-gray-800/50 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">العربية</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.language.arabic')}
                    </div>
                  </div>
                </div>
                {selectedLanguage === 'ar' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button 
                onClick={() => handleLanguageChange('en')}
                className={`w-full p-4 rounded-lg ${
                  selectedLanguage === 'en'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : isDark
                      ? 'bg-gray-800/50 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">English</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.language.english')}
                    </div>
                  </div>
                </div>
                {selectedLanguage === 'en' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button 
                onClick={() => handleLanguageChange('fr')}
                className={`w-full p-4 rounded-lg ${
                  selectedLanguage === 'fr'
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : isDark
                      ? 'bg-gray-800/50 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">Français</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.language.french')}
                    </div>
                  </div>
                </div>
                {selectedLanguage === 'fr' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.notifications.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium">{t('settings.notifications.push')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.notifications.description')}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium">{t('settings.notifications.email')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.notifications.description')}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">

    
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {t('settings.notifications.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">{t('settings.notifications.transactions')}</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.transactions}
                      onChange={() => handleNotificationChange('transactions')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">{t('settings.notifications.marketing')}</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.marketing}
                      onChange={() => handleNotificationChange('marketing')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">{t('settings.notifications.security')}</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.security}
                      onChange={() => handleNotificationChange('security')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.security.title')}</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className={`w-full p-4 rounded-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">{t('settings.security.changePassword')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.security.description')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
              </button>

              <button 
                onClick={() => setShowTwoFactorOverlay(true)}
                className={`w-full p-4 rounded-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">{t('settings.security.twoFactor')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.security.description')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
              </button>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${
              isDark 
                ? 'bg-red-900/20 backdrop-blur-sm border-red-800' 
                : 'bg-red-50 border-red-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">{t('settings.dangerZone.title')}</h2>
            <div className="space-y-4">
              <button 
                onClick={() => setShowDeleteAccountOverlay(true)}
                className="w-full p-4 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <div className="font-medium text-red-600 dark:text-red-400">{t('settings.dangerZone.deleteAccount.title')}</div>
                    <div className="text-sm text-red-500 dark:text-red-400">
                      {t('settings.dangerZone.deleteAccount.description')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-500" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.accountInfo.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {userProfile?.profilePicture ? (
                  <img 
                    src={getImageUrl(userProfile.profilePicture)} 
                    alt={userProfile.displayName} 
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Profile image failed to load:', userProfile.profilePicture);
                      e.target.src = ''; // Clear the src to prevent infinite error loop
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium">{userProfile?.displayName || userProfile?.email || 'User'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {userProfile?.email || 'Loading...'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {userProfile?.phoneNumber || t('settings.accountInfo.noPhoneNumber')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.accountInfo.memberSince')} {userProfile?.createdAt ? format(new Date(userProfile.createdAt), 'MMMM yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg max-w-md w-full`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">{t('settings.dangerZone.deleteAccount.confirmTitle')}</h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('settings.dangerZone.deleteAccount.confirmMessage')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('settings.dangerZone.deleteAccount.cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 p-3 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                >
                  {t('settings.dangerZone.deleteAccount.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Update Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg max-w-md w-full`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('settings.security.changePassword')}</h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <PasswordUpdateForm onClose={() => setShowPasswordModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Factor Coming Soon Overlay */}
      <AnimatePresence>
        {showTwoFactorOverlay && (
          <ComingSoonOverlay
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account with 2FA"
            onClose={() => setShowTwoFactorOverlay(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Account Coming Soon Overlay */}
      <AnimatePresence>
        {showDeleteAccountOverlay && (
          <ComingSoonOverlay
            title="Account Deletion"
            description="Safely delete your account and all associated data"
            onClose={() => setShowDeleteAccountOverlay(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Settings
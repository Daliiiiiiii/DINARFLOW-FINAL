import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  RiLockLine, 
  RiBellLine, 
  RiShieldLine, 
  RiUserSettingsLine,
  RiDeleteBinLine,
  RiInformationLine,
  RiCheckLine,
  RiCloseLine,
  RiGlobalLine,
  RiTimeLine
} from 'react-icons/ri'
import { toast } from 'react-toastify'
import PasswordUpdateForm from '../components/forms/PasswordUpdateForm'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'

const Settings = () => {
  const { userProfile, updateUserProfile, setUserProfile, logout } = useAuth()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState({
    emailNotifications: userProfile?.notificationsEnabled || false,
    transactionAlerts: true,
    marketingEmails: false
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
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }))
  }
  
  const handleSecurityChange = (e) => {
    const { name, checked } = e.target
    setSecurity(prev => ({
      ...prev,
      [name]: checked
    }))
  }
  
  const saveNotificationSettings = async () => {
    try {
      setError('')
      setSuccess('')
      setUpdatingNotifications(true)
      
      await updateUserProfile({
        notificationsEnabled: notifications.emailNotifications
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
      setError('')
      
      if (!userProfile) {
        setError('User profile not found.')
        return
      }

      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'request' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.info(data.message)
      
      // Log out the user after requesting deletion
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Delete account error:', error)
      setError('Failed to request account deletion: ' + error.message)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      if (!userProfile) {
        setError('User profile not found.')
        return
      }

      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cancel' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Update local state
      setUserProfile({
        ...userProfile,
        deletion_requested_at: null,
        account_status: 'active'
      })

      toast.success(data.message)
    } catch (error) {
      console.error('Cancel deletion error:', error)
      setError('Failed to cancel account deletion: ' + error.message)
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
    <Card className="mb-6">
      <div className="p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className={`${typography.h3} text-gray-900 dark:text-gray-100`}>{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            <div className="mt-4">{children}</div>
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
            <RiCheckLine className="h-3 w-3 text-primary-600" />
          </span>
          <span
            className={`${
              checked ? 'opacity-0' : 'opacity-100'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
          >
            <RiCloseLine className="h-3 w-3 text-gray-400" />
          </span>
        </span>
      </button>
    </div>
  )
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 py-8"
    >
      <h1 className={`${typography.h1} mb-8 text-gray-900 dark:text-gray-100`}>Account Settings</h1>

      <AnimatePresence>
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
        {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex">
                  <RiCheckLine className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex">
                  <RiCloseLine className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SettingSection
        icon={RiBellLine}
        title="Notifications"
        description="Manage how you receive notifications and alerts"
      >
            <div className="space-y-4">
          <Toggle
            label="Email Notifications"
                        name="emailNotifications"
                        checked={notifications.emailNotifications}
                        onChange={handleNotificationChange}
            disabled={updatingNotifications}
          />
          <Toggle
            label="Transaction Alerts"
                        name="transactionAlerts"
                        checked={notifications.transactionAlerts}
                        onChange={handleNotificationChange}
            disabled={updatingNotifications}
          />
          <Toggle
            label="Marketing Emails"
                        name="marketingEmails"
                        checked={notifications.marketingEmails}
                        onChange={handleNotificationChange}
            disabled={updatingNotifications}
          />
            <div className="mt-6">
            <Button
                onClick={saveNotificationSettings}
                disabled={updatingNotifications}
              className="w-full sm:w-auto"
              >
              {updatingNotifications ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        icon={RiLockLine}
        title="Security"
        description="Manage your account security and authentication settings"
      >
        <div className="space-y-4">
          <Toggle
            label="Two-Factor Authentication"
            name="twoFactorEnabled"
            checked={security.twoFactorEnabled}
            onChange={handleSecurityChange}
            disabled={updatingSecurity}
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={saveSecuritySettings}
              disabled={updatingSecurity}
              className="w-full sm:w-auto"
            >
              {updatingSecurity ? 'Saving...' : 'Save Security Settings'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordForm(true)}
              className="w-full sm:w-auto"
            >
              Change Password
            </Button>
            <Button
              variant="secondary"
              onClick={handleSessionsClick}
              className="w-full sm:w-auto"
            >
              Manage Active Sessions
            </Button>
              </div>
            </div>
      </SettingSection>

      <SettingSection
        icon={RiGlobalLine}
        title="Privacy"
        description="Review our privacy policy and manage your data"
      >
        <div className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => setShowPrivacyPolicy(true)}
            className="w-full sm:w-auto"
          >
            View Privacy Policy
          </Button>
          </div>
      </SettingSection>

      <SettingSection
        icon={RiDeleteBinLine}
        title="Account Management"
        description="Manage your account status and data"
      >
        <div className="space-y-4">
          {userProfile?.deletion_requested_at ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                  <RiTimeLine className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Account Deletion Scheduled
                    </h3>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                      Your account is scheduled for deletion. The process will complete in 14 days from the request date.
                      You can cancel the deletion process before it completes.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                      onClick={handleCancelDeletion}
                className="w-full sm:w-auto"
                    >
                      Cancel Account Deletion
              </Button>
            </div>
                  ) : (
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto"
            >
              Delete Account
            </Button>
          )}
        </div>
      </SettingSection>

      <AnimatePresence>
        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <Card className="dark:bg-gray-800">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`${typography.h2} text-gray-900 dark:text-gray-100`}>Change Password</h2>
                    <button 
                      onClick={() => setShowPasswordForm(false)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <RiCloseLine className="w-6 h-6" />
                    </button>
                  </div>
                  <PasswordUpdateForm onClose={() => setShowPasswordForm(false)} />
                </div>
              </Card>
            </motion.div>
          </motion.div>
      )}

      {showPrivacyPolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-2xl"
            >
              <Card>
                <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                    <h2 className={`${typography.h2} text-gray-900 dark:text-gray-100`}>Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                      <RiCloseLine className="w-6 h-6" />
              </button>
            </div>
                  <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                {privacyPolicyContent}
              </pre>
            </div>
            <div className="mt-6 flex justify-end">
                    <Button
                      variant="secondary"
                onClick={() => setShowPrivacyPolicy(false)}
              >
                Close
                    </Button>
            </div>
          </div>
              </Card>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Settings
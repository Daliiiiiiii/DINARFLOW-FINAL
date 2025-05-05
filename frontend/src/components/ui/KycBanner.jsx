import { useState } from 'react'
import { RiShieldLine, RiShieldCheckLine, RiAlertLine, RiCloseLine } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const KycBanner = () => {
  const [isVisible, setIsVisible] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!isVisible || !user) return null

  const getKycContent = () => {
    switch (user.kyc_status) {
      case 'in_progress':
        return {
          icon: <RiShieldLine className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
          title: 'KYC Verification in Progress',
          message: 'Your KYC verification is being processed. We will notify you once it is complete.',
          action: null,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      case 'rejected':
        return {
          icon: <RiAlertLine className="w-6 h-6 text-red-500 dark:text-red-400" />,
          title: 'KYC Verification Failed',
          message: 'Your KYC verification was rejected. Please update your information and try again.',
          action: (
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
              className="mt-2"
            >
              Update KYC
            </Button>
          ),
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      case 'verified':
        return {
          icon: <RiShieldCheckLine className="w-6 h-6 text-green-500 dark:text-green-400" />,
          title: 'KYC Verified',
          message: 'Your account is fully verified. You have access to all features.',
          action: null,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      default:
        return {
          icon: <RiShieldLine className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />,
          title: 'KYC Verification Required',
          message: 'Please complete your KYC verification to unlock all features.',
          action: (
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
              className="mt-2"
            >
              Complete KYC
            </Button>
          ),
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
    }
  }

  const content = getKycContent()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className={`relative ${content.bgColor} border ${content.borderColor}`}>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
          <div className="flex items-start p-4">
            <div className="flex-shrink-0">{content.icon}</div>
            <div className="ml-3 w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {content.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {content.message}
              </p>
              {content.action}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

export default KycBanner
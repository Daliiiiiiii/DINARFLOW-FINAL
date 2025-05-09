import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiSearchLine, 
  RiUserLine, 
  RiAlertLine,
  RiSendPlaneLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri'
import { useTransactions } from '../../contexts/TransactionContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import './CryptoExchange.css'

const CryptoTransfer = () => {
  const { transferCrypto } = useTransactions()
  const { userProfile } = useAuth()
  const { showError } = useNotification()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  
  const [recipientEmail, setRecipientEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLimits, setShowLimits] = useState(false)
  const [recipientInfo, setRecipientInfo] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // Transaction limits
  const limits = {
    minAmount: 0.1,
    maxAmount: 1000,
    dailyLimit: 10000
  }
  
  // Search for recipient
  const searchRecipient = async (email) => {
    if (!email || email.length < 3) {
      setRecipientInfo(null)
      return
    }
    
    try {
      setIsSearching(true)
      const response = await axios.get(`/api/users/search?email=${email}`)
      if (response.data.user) {
        setRecipientInfo(response.data.user)
      } else {
        setRecipientInfo(null)
      }
    } catch (error) {
      console.error('Error searching recipient:', error)
      setRecipientInfo(null)
    } finally {
      setIsSearching(false)
    }
  }
  
  // Handle recipient input change
  const handleRecipientChange = (e) => {
    const value = e.target.value
    setRecipientEmail(value)
    searchRecipient(value)
  }
  
  // Handle amount increment/decrement
  const handleAmountAdjust = (increment) => {
    const currentAmount = parseFloat(amount) || 0
    const step = 0.1
    const newAmount = Math.max(0, currentAmount + (increment ? step : -step))
    setAmount(newAmount.toFixed(4))
  }
  
  // Validate amount against limits
  const validateAmount = (amount) => {
    const parsedAmount = parseFloat(amount)
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return t('crypto.transfer.errors.invalidAmount')
    }
    
    if (parsedAmount < limits.minAmount) {
      return t('crypto.transfer.errors.minAmount', { amount: limits.minAmount })
    }
    
    if (parsedAmount > limits.maxAmount) {
      return t('crypto.transfer.errors.maxAmount', { amount: limits.maxAmount })
    }
    
    if (parsedAmount > limits.dailyLimit) {
      return t('crypto.transfer.errors.dailyLimit', { amount: limits.dailyLimit })
    }
    
    if (parsedAmount > userProfile?.cryptoBalance) {
      return t('crypto.transfer.errors.insufficientBalance')
    }
    
    return null
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    // Input validation
    if (!recipientEmail) {
      setError(t('crypto.transfer.errors.recipientRequired'))
      return
    }
    
    const validationError = validateAmount(amount)
    if (validationError) {
      setError(validationError)
      return
    }
    
    const parsedAmount = parseFloat(amount)
    
    setIsSubmitting(true)
    
    try {
      await transferCrypto(recipientEmail, parsedAmount, description)
      setSuccess(true)
      setRecipientEmail('')
      setAmount('')
      setDescription('')
      setRecipientInfo(null)
    } catch (error) {
      setError(error.message || t('crypto.transfer.errors.error'))
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mr-3">
            <RiSendPlaneLine className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {t('crypto.transfer.title')}
          </h2>
        </div>
        <button
          onClick={() => setShowLimits(!showLimits)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <RiAlertLine size={20} />
        </button>
      </div>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
        >
          {t('crypto.transfer.success')}
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg"
        >
          {error}
        </motion.div>
      )}
      
      <div className={`${isDark ? 'bg-gray-900/50' : 'bg-white'} p-4 rounded-lg mb-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`flex justify-between items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
          <span>{t('crypto.transfer.balanceLabel')}</span>
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{userProfile?.cryptoBalance?.toFixed(4) || '0.0000'} DFLOW</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {t('crypto.transfer.recipientEmail')}
            </label>
            <div className="relative">
            <input
              type="email"
              id="recipient"
              value={recipientEmail}
              onChange={handleRecipientChange}
              placeholder={t('crypto.transfer.recipientPlaceholder')}
              className={`w-full px-4 py-3 pl-10 rounded-xl ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-lg`}
              required
            />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-primary-300 dark:border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RiSearchLine size={20} />
                )}
              </div>
            </div>
            {recipientInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center text-sm bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-900/50"
              >
                <RiUserLine className="text-primary-500 dark:text-primary-400 mr-2" size={20} />
                <span className="text-primary-700 dark:text-primary-300 font-medium">{recipientInfo.displayName}</span>
              </motion.div>
            )}
          </div>
          
          <div>
            <label htmlFor="amount" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {t('crypto.transfer.amountLabel')}
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('crypto.transfer.amountPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-lg font-medium tracking-wide no-spinners`}
                step="0.0001"
                min="0"
                required
              />
              <div className="absolute right-0 inset-y-0 flex items-center">
                <div className="flex items-center border-l border-gray-200 dark:border-gray-700 px-3 mr-1 h-[calc(100%-12px)] my-[6px]">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleAmountAdjust(true)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-0.5 transition-colors"
                    >
                      <RiArrowUpLine size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAmountAdjust(false)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-0.5 transition-colors"
                    >
                      <RiArrowDownLine size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {t('crypto.transfer.descriptionLabel')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('crypto.transfer.descriptionPlaceholder')}
              className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-lg resize-none`}
              rows={3}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || !recipientEmail || !amount}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('crypto.transfer.processing')}
              </>
            ) : (
              <>
                <RiSendPlaneLine className="mr-2" size={20} />
                {t('crypto.transfer.sendButton')}
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Transaction Limits Modal */}
      <AnimatePresence>
        {showLimits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('crypto.transfer.limitsTitle')}</h2>
                <button
                  onClick={() => setShowLimits(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RiAlertLine size={24} />
                </button>
              </div>
              <div className="space-y-4 text-gray-600">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">{t('crypto.transfer.limitsHeader')}</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• {t('crypto.transfer.minAmount')}: {limits.minAmount} DFLOW</li>
                    <li>• {t('crypto.transfer.maxAmount')}: {limits.maxAmount} DFLOW</li>
                    <li>• {t('crypto.transfer.dailyLimit')}: {limits.dailyLimit} DFLOW</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CryptoTransfer
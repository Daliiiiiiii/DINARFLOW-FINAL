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
import axios from 'axios'
import './CryptoExchange.css'

const CryptoTransfer = () => {
  const { transferCrypto } = useTransactions()
  const { userProfile } = useAuth()
  const { showError } = useNotification()
  
  const [recipient, setRecipient] = useState('')
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
    minAmount: 1,
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
    setRecipient(value)
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
      return 'Please enter a valid amount'
    }
    
    if (parsedAmount < limits.minAmount) {
      return `Minimum amount is ${limits.minAmount} DFLOW`
    }
    
    if (parsedAmount > limits.maxAmount) {
      return `Maximum amount is ${limits.maxAmount} DFLOW`
    }
    
    if (parsedAmount > userProfile?.cryptoBalance) {
      return 'Insufficient DFLOW balance'
    }
    
    return null
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    // Input validation
    if (!recipient) {
      setError('Please enter recipient email')
      return
    }
    
    const validationError = validateAmount(amount)
    if (validationError) {
      setError(validationError)
      return
    }
    
    const transferAmount = parseFloat(amount)
    
    setIsSubmitting(true)
    
    try {
      await transferCrypto(recipient, transferAmount, description)
      setSuccess(true)
      // Reset form
      setRecipient('')
      setAmount('')
      setDescription('')
      setRecipientInfo(null)
    } catch (error) {
      setError(error.message || 'An error occurred during the transfer')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mr-3">
            <RiSendPlaneLine className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Transfer DFLOW</h2>
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
          Your crypto transfer was successful!
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
      
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>Your DFLOW Balance</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{userProfile?.cryptoBalance?.toFixed(4) || '0.0000'} DFLOW</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Email *
            </label>
            <div className="relative">
            <input
              type="email"
              id="recipient"
              value={recipient}
                onChange={handleRecipientChange}
              placeholder="recipient@example.com"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 text-lg"
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
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (DFLOW) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 text-lg font-medium tracking-wide no-spinners"
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note to your transfer"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 text-lg resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || !recipient || !amount}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <RiSendPlaneLine className="mr-2" size={20} />
                Send DFLOW
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
                <h2 className="text-xl font-semibold text-gray-900">Transaction Limits</h2>
                <button
                  onClick={() => setShowLimits(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RiAlertLine size={24} />
                </button>
              </div>
              <div className="space-y-4 text-gray-600">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Transfer Limits</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Minimum amount: {limits.minAmount} DFLOW</li>
                    <li>• Maximum amount: {limits.maxAmount} DFLOW</li>
                    <li>• Daily limit: {limits.dailyLimit} DFLOW</li>
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
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiSendPlaneLine, 
  RiUserLine, 
  RiSearchLine,
  RiWalletLine,
  RiInformationLine,
  RiBankLine,
  RiArrowRightLine,
  RiLoader4Line
} from 'react-icons/ri'
import { useTransactions } from '../../contexts/TransactionContext'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

const TransferForm = () => {
  const { transferTND } = useTransactions()
  const { userProfile } = useAuth()
  const { t } = useTranslation()
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [recipientInfo, setRecipientInfo] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    // Input validation
    if (!recipient || !amount) {
      setError('Please fill in all required fields')
      return
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    const transferAmount = parseFloat(amount)
    
    setIsSubmitting(true)
    
    try {
      await transferTND(recipient, transferAmount, description)
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
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Transfer TND</h2>
        </div>
        <div className="flex items-center">
          <RiWalletLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            {userProfile?.walletBalance?.toFixed(2) || '0.00'} TND
          </span>
        </div>
      </div>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
        >
          Your transfer was successful!
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
      
      <form onSubmit={handleSubmit}>
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
                className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 text-lg"
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
                className="mt-2 flex items-center text-sm bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl border border-primary-100 dark:border-primary-800"
              >
                <RiUserLine className="text-primary-500 dark:text-primary-400 mr-2" size={20} />
                <span className="text-primary-700 dark:text-primary-300 font-medium">{recipientInfo.displayName}</span>
              </motion.div>
            )}
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (TND) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 text-lg font-medium tracking-wide no-spinners"
                step="0.01"
                min="1"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4">
                <span className="text-gray-500 dark:text-gray-400 font-medium">TND</span>
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
              placeholder="What's this transfer for?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 min-h-[100px] resize-none"
              maxLength={100}
            />
            <div className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">
              {description.length}/100
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || !recipient || !amount}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-primary-300 dark:disabled:bg-primary-700/50 transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <RiSendPlaneLine className="mr-2" size={20} />
                Send Transfer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TransferForm
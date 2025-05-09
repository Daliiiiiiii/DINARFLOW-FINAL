import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiArrowLeftRightLine, 
  RiInformationLine, 
  RiAlertLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiExchangeDollarLine
} from 'react-icons/ri'
import { useTransactions } from '../../contexts/TransactionContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import './CryptoExchange.css'

const CryptoExchange = () => {
  const { buyCrypto, sellCrypto, cryptoRate } = useTransactions()
  const { userProfile } = useAuth()
  const { showError } = useNotification()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  
  const [exchangeMode, setExchangeMode] = useState('buy')
  const [amount, setAmount] = useState('')
  const [calculatedAmount, setCalculatedAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLimits, setShowLimits] = useState(false)
  
  // Transaction limits
  const limits = {
    minAmount: 1,
    maxAmount: 1000,
    dailyLimit: 10000
  }
  
  // Calculate the exchange value when amount changes
  const handleAmountChange = (e) => {
    const inputAmount = e.target.value
    setAmount(inputAmount)
    
    if (inputAmount && !isNaN(inputAmount) && parseFloat(inputAmount) >= 0) {
      if (exchangeMode === 'buy') {
        // TND to Crypto conversion
        const cryptoAmount = parseFloat(inputAmount) / cryptoRate
        setCalculatedAmount(cryptoAmount.toFixed(4))
      } else {
        // Crypto to TND conversion
        const tndAmount = parseFloat(inputAmount) * cryptoRate
        setCalculatedAmount(tndAmount.toFixed(2))
      }
    } else {
      setCalculatedAmount('')
    }
  }

  // Handle amount increment/decrement
  const handleAmountAdjust = (increment) => {
    const currentAmount = parseFloat(amount) || 0
    const step = exchangeMode === 'buy' ? 1 : 0.1
    const newAmount = Math.max(0, currentAmount + (increment ? step : -step))
    setAmount(newAmount.toString())
    
    if (newAmount > 0) {
      if (exchangeMode === 'buy') {
        const cryptoAmount = newAmount / cryptoRate
        setCalculatedAmount(cryptoAmount.toFixed(4))
      } else {
        const tndAmount = newAmount * cryptoRate
        setCalculatedAmount(tndAmount.toFixed(2))
      }
    } else {
      setCalculatedAmount('')
    }
  }
  
  // Switch between buy and sell modes
  const toggleExchangeMode = () => {
    setExchangeMode(exchangeMode === 'buy' ? 'sell' : 'buy')
    setAmount('')
    setCalculatedAmount('')
    setError('')
    setSuccess(false)
  }
  
  // Validate amount against limits
  const validateAmount = (amount) => {
    const parsedAmount = parseFloat(amount)
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return t('crypto.exchange.errors.invalidAmount')
    }
    
    if (parsedAmount < limits.minAmount) {
      return t('crypto.exchange.errors.minAmount', { 
        amount: limits.minAmount, 
        currency: exchangeMode === 'buy' ? 'TND' : 'DFLOW' 
      })
    }
    
    if (parsedAmount > limits.maxAmount) {
      return t('crypto.exchange.errors.maxAmount', { 
        amount: limits.maxAmount, 
        currency: exchangeMode === 'buy' ? 'TND' : 'DFLOW' 
      })
    }
    
    if (exchangeMode === 'buy' && parsedAmount > limits.dailyLimit) {
      return t('crypto.exchange.errors.dailyLimit', { amount: limits.dailyLimit })
    }
    
    return null
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    // Input validation
    const validationError = validateAmount(amount)
    if (validationError) {
      setError(validationError)
      return
    }
    
    const parsedAmount = parseFloat(amount)
    
    // Check balance
    if (exchangeMode === 'buy' && parsedAmount > userProfile?.walletBalance) {
      setError(t('crypto.exchange.errors.insufficientTnd'))
      return
    }
    
    if (exchangeMode === 'sell' && parsedAmount > userProfile?.cryptoBalance) {
      setError(t('crypto.exchange.errors.insufficientDflow'))
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (exchangeMode === 'buy') {
        await buyCrypto(parsedAmount)
      } else {
        await sellCrypto(parsedAmount)
      }
      
      setSuccess(true)
      setAmount('')
      setCalculatedAmount('')
    } catch (error) {
      setError(error.message || t('crypto.exchange.errors.error'))
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${exchangeMode === 'buy' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} flex items-center justify-center mr-3`}>
            <RiExchangeDollarLine 
              className={exchangeMode === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} 
              size={24} 
            />
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {exchangeMode === 'buy' ? t('crypto.exchange.buy') : t('crypto.exchange.sell')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowLimits(!showLimits)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <RiInformationLine size={20} />
          </button>
          <button
            onClick={toggleExchangeMode}
            className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition-colors
              ${exchangeMode === 'buy' 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
          >
            <RiArrowLeftRightLine className="mr-1" size={16} />
            {t('crypto.exchange.switchTo')} {exchangeMode === 'buy' ? t('crypto.exchange.sell') : t('crypto.exchange.buy')}
          </button>
        </div>
      </div>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
        >
          {t('crypto.exchange.success', { type: exchangeMode === 'buy' ? t('crypto.exchange.buy').toLowerCase() : t('crypto.exchange.sell').toLowerCase() })}
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
          <span>{t('crypto.exchange.currentRate')}</span>
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>1 DFLOW = {cryptoRate.toFixed(2)} TND</span>
        </div>
        <div className={`flex justify-between items-center mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
          <span>{t('crypto.exchange.yourBalance')}</span>
          <div className="text-right">
            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{userProfile?.walletBalance?.toFixed(2) || '0.00'} TND</div>
            <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{userProfile?.cryptoBalance?.toFixed(4) || '0.0000'} DFLOW</div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {exchangeMode === 'buy' ? t('crypto.exchange.tndAmount') : t('crypto.exchange.dflowAmount')}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className={`w-full px-4 py-3 rounded-xl ${isDark ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} focus:border-primary-500 dark:focus:border-primary-400 focus:ring focus:ring-primary-200 dark:focus:ring-primary-900 focus:ring-opacity-50 transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 text-lg font-medium tracking-wide no-spinners`}
                step={exchangeMode === 'buy' ? '0.01' : '0.0001'}
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
                  <span className="text-gray-500 ml-2 font-medium">
                    {exchangeMode === 'buy' ? 'TND' : 'DFLOW'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center shadow-inner">
              <RiArrowLeftRightLine className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {exchangeMode === 'buy' ? t('crypto.exchange.dflowAmount') : t('crypto.exchange.tndAmount')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={calculatedAmount}
                className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900 text-gray-200' : 'border-gray-100 bg-white text-gray-800'} text-lg font-medium tracking-wide cursor-not-allowed`}
                placeholder="0.00"
                disabled
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {exchangeMode === 'buy' ? 'DFLOW' : 'TND'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || !amount || !calculatedAmount}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white transition-colors
              ${exchangeMode === 'buy'
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('crypto.exchange.processing')}
              </>
            ) : (
              <>
                <RiExchangeDollarLine className="mr-2" size={20} />
                {exchangeMode === 'buy' ? t('crypto.exchange.buy') : t('crypto.exchange.sell')}
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
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('crypto.exchange.limits.title')}</h2>
                <button
                  onClick={() => setShowLimits(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <RiAlertLine size={24} />
                </button>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('crypto.exchange.limits.buyLimits')}</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• {t('crypto.exchange.limits.minAmount')}: {limits.minAmount} TND</li>
                    <li>• {t('crypto.exchange.limits.maxAmount')}: {limits.maxAmount} TND</li>
                    <li>• {t('crypto.exchange.limits.dailyLimit')}: {limits.dailyLimit} TND</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('crypto.exchange.limits.sellLimits')}</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• {t('crypto.exchange.limits.minAmount')}: {limits.minAmount} DFLOW</li>
                    <li>• {t('crypto.exchange.limits.maxAmount')}: {limits.maxAmount} DFLOW</li>
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

export default CryptoExchange
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  RiExchangeLine, 
  RiArrowLeftRightLine, 
  RiHistoryLine,
  RiLineChartLine,
  RiInformationLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiWalletLine,
  RiCoinsLine,
  RiCloseLine,
  RiRefreshLine,
  RiAlertLine,
  RiArrowRightUpLine,
  RiArrowLeftDownLine,
  RiAddLine,
  RiSubtractLine,
  RiBankCardLine,
  RiBankLine,
  RiArrowRightLine,
  RiUserLine,
  RiExchangeDollarLine,
  RiSendPlaneLine
} from 'react-icons/ri'
import CryptoExchange from '../components/financial/CryptoExchange'
import CryptoTransfer from '../components/financial/CryptoTransfer'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../contexts/TransactionContext'
import { useNotification } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'
import { format } from 'date-fns'
import ActionLoader from '../assets/animations/ActionLoader'

const Crypto = () => {
  const [activeTab, setActiveTab] = useState('exchange')
  const { userProfile } = useAuth()
  const { cryptoRate, refreshTransactions, transactions } = useTransactions()
  const { showSuccess, showError } = useNotification()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const [showInfo, setShowInfo] = useState(false)
  const [marketData, setMarketData] = useState({
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    lastUpdated: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showTopUpOptions, setShowTopUpOptions] = useState(false)
  const [hoveredAction, setHoveredAction] = useState(null)
  const [showSendOptions, setShowSendOptions] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Calculate total crypto value
  const totalCryptoValue = userProfile?.cryptoBalance ? 
    (userProfile.cryptoBalance * cryptoRate).toFixed(2) : '0.00'
  
  // Fetch market data
  const fetchMarketData = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/api/crypto/market-data')
      setMarketData({
        ...response.data,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('Error fetching market data:', error)
      showError('Failed to fetch market data')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Refresh data periodically
  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])
  
  // Handle tab change with animation
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (refreshTransactions) {
      refreshTransactions()
    }
  }
  
  // Handle refresh
  const handleRefresh = async () => {
    if (!refreshTransactions) return
    
    setIsRefreshing(true)
    try {
      await refreshTransactions()
    } catch (error) {
      showError(t('crypto.errors.refreshFailed'))
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Calculate total value (TND + crypto converted to TND)
  const totalValue = userProfile 
    ? (userProfile.walletBalance || 0) + ((userProfile.cryptoBalance || 0) * cryptoRate)
    : 0
  
  // Filter transactions based on active tab
  const filteredTransactions = transactions?.filter(tx => {
    if (activeTab === 'all') return true
    if (activeTab === 'tnd') return tx.currency === 'TND'
    if (activeTab === 'crypto') return tx.currency === 'DFLOW'
    return true
  })
  
  // Get recent transactions (last 5)
  const recentTransactions = filteredTransactions?.length ? filteredTransactions.slice(0, 5) : []
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Processing...'
    return format(new Date(timestamp), 'MMM d, yyyy • h:mm a')
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  // Format crypto amount
  const formatCrypto = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount)
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <>
        <ActionLoader isLoading={true} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center h-64"
      >
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </motion.div>
      </>
    )
  }
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-100'} flex items-center justify-center`}>
            <RiCoinsLine className="text-accent-600 dark:text-accent-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('crypto.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('crypto.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors flex items-center gap-2`}
          >
            <RiRefreshLine className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('crypto.refresh')}
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors flex items-center gap-2`}
          >
            <RiInformationLine className="w-4 h-4" />
            {t('crypto.info')}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden shadow-lg`}
          >
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabChange('exchange')}
                className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                  activeTab === 'exchange'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <RiExchangeLine className="w-4 h-4" />
                  {t('crypto.buySell')}
                </div>
                {activeTab === 'exchange' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
              <button
                onClick={() => handleTabChange('transfer')}
                className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                  activeTab === 'transfer'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <RiArrowLeftRightLine className="w-4 h-4" />
                  {t('crypto.transfer.title')}
                </div>
                {activeTab === 'transfer' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            </div>
            
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'exchange' ? (
                  <motion.div
                    key="exchange"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CryptoExchange />
                  </motion.div>
                ) : (
                  <motion.div
                    key="transfer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CryptoTransfer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Total Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-lg relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('crypto.totalBalance')}</h3>
                <RiWalletLine className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(totalValue)}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {t('crypto.lastUpdated')}: {new Date().toLocaleString()}
              </p>
            </div>
          </motion.div>

          {/* Market Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{t('crypto.marketOverview')}</h3>
              <RiLineChartLine className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('crypto.currentRate')}</span>
                <span className="font-medium">1 DFLOW = {formatCurrency(cryptoRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('crypto.24hChange')}</span>
                <span className={`${marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                  {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                  {marketData.priceChange24h !== 0 && (
                    <RiArrowLeftRightLine className={marketData.priceChange24h > 0 ? 'rotate-45' : '-rotate-45'} size={14} />
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('crypto.marketCap')}</span>
                <span className="font-medium">{formatCurrency(marketData.marketCap)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t('crypto.24hVolume')}</span>
                <span className="font-medium">{formatCurrency(marketData.volume24h)}</span>
              </div>
            </div>
          </motion.div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-lg`}
          >
            <h3 className="text-lg font-semibold mb-4">{t('crypto.securityInformation')}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <RiShieldCheckLine className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">{t('crypto.secureTransactions')}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('crypto.secureTransactionsDescription')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <RiTimeLine className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">{t('crypto.realTimeUpdates')}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('crypto.realTimeUpdatesDescription')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <RiAlertLine className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium">{t('crypto.transactionLimits')}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('crypto.transactionLimitsDescription')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-xl shadow-xl max-w-md w-full p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t('crypto.aboutTitle')}</h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RiCloseLine className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {t('crypto.aboutDescription')}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('crypto.currentRateDescription', { rate: formatCurrency(cryptoRate) })}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('crypto.allTransactionsDescription')}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-2">{t('crypto.transactionLimits')}</h3>
                  <ul className="space-y-2">
                    <li className="text-gray-500 dark:text-gray-400">{t('crypto.dailyBuySellLimit')}: {formatCurrency(10000)}</li>
                    <li className="text-gray-500 dark:text-gray-400">{t('crypto.minimumTransaction')}: {formatCurrency(1)}</li>
                    <li className="text-gray-500 dark:text-gray-400">{t('crypto.maximumTransaction')}: {formatCurrency(1000)}</li>
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

export default Crypto
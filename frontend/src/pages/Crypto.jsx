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
  RiAlertLine
} from 'react-icons/ri'
import CryptoExchange from '../components/financial/CryptoExchange'
import CryptoTransfer from '../components/financial/CryptoTransfer'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../contexts/TransactionContext'
import { useNotification } from '../contexts/NotificationContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'

const Crypto = () => {
  const [activeTab, setActiveTab] = useState('exchange')
  const { userProfile } = useAuth()
  const { cryptoRate, refreshTransactions } = useTransactions()
  const { showSuccess, showError } = useNotification()
  const [showInfo, setShowInfo] = useState(false)
  const [marketData, setMarketData] = useState({
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    lastUpdated: null
  })
  const [isLoading, setIsLoading] = useState(false)
  
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
    refreshTransactions()
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mr-4">
              <RiCoinsLine className="text-accent-600 dark:text-accent-400" size={24} />
            </div>
            <div>
              <h1 className={typography.h1}>Crypto Wallet</h1>
              <p className={typography.muted.base}>Buy, sell, and transfer DFLOW</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<RiRefreshLine size={16} className={isLoading ? 'animate-spin' : ''} />}
              onClick={fetchMarketData}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<RiHistoryLine size={16} />}
              onClick={() => navigate('/history')}
            >
              View History
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => handleTabChange('exchange')}
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors 
                ${activeTab === 'exchange' 
                    ? 'text-primary-700 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
                <div className="flex items-center justify-center">
                  <RiExchangeLine className="mr-2" size={18} />
              Buy / Sell DFLOW
                </div>
            </button>
            <button
                onClick={() => handleTabChange('transfer')}
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors 
                ${activeTab === 'transfer' 
                    ? 'text-primary-700 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
                <div className="flex items-center justify-center">
                  <RiArrowLeftRightLine className="mr-2" size={18} />
              Transfer DFLOW
                </div>
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
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-900 dark:to-accent-800"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white dark:text-white">DFLOW Balance</h3>
                <RiWalletLine size={24} className="text-white/80 dark:text-white/80" />
              </div>
              <p className="text-3xl font-bold mb-2 text-white dark:text-white">
                {userProfile?.cryptoBalance?.toFixed(4) || '0.0000'} DFLOW
              </p>
              <p className="text-sm text-white/80 dark:text-white/80">≈ {totalCryptoValue} TND</p>
            </div>
          </Card>

          {/* Market Info */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={typography.h3}>Market Overview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RiInformationLine size={16} />}
                  onClick={() => setShowInfo(true)}
                >
                  Info
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={typography.muted.base}>Current Rate</span>
                  <span className={typography.body.base}>1 DFLOW = {cryptoRate} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={typography.muted.base}>24h Change</span>
                  <span className={`${marketData.priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-medium`}>
                    {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={typography.muted.base}>Market Cap</span>
                  <span className={typography.body.base}>{marketData.marketCap.toLocaleString()} TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={typography.muted.base}>24h Volume</span>
                  <span className={typography.body.base}>{marketData.volume24h.toLocaleString()} TND</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className={typography.muted.sm}>
                    Last updated: {marketData.lastUpdated ? format(new Date(marketData.lastUpdated), 'HH:mm:ss') : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Info */}
          <Card>
            <div className="p-6">
              <h3 className={typography.h3}>Security Information</h3>
              <div className="space-y-4 mt-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-3">
                    <RiShieldCheckLine className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <h4 className={typography.body.base}>Secure Transactions</h4>
                    <p className={typography.muted.sm}>All crypto transactions are encrypted</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                    <RiTimeLine className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className={typography.body.base}>Processing Time</h4>
                    <p className={typography.muted.sm}>Transactions are usually completed within minutes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center mr-3">
                    <RiAlertLine className="text-yellow-600 dark:text-yellow-400" size={20} />
                  </div>
                  <div>
                    <h4 className={typography.body.base}>Transaction Limits</h4>
                    <p className={typography.muted.sm}>Daily limit: 10,000 TND</p>
                  </div>
                </div>
              </div>
          </div>
          </Card>
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={typography.h2}>About DFLOW</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfo(false)}
                >
                  <RiCloseLine size={24} />
                </Button>
              </div>
              <div className="space-y-4">
                <p className={typography.body.base}>
                  DFLOW is our native cryptocurrency designed for fast and secure transactions within our platform.
                </p>
                <p className={typography.body.base}>
                  The current exchange rate is fixed at 1 DFLOW = {cryptoRate} TND, providing stability for users.
                </p>
                <p className={typography.body.base}>
                  All transactions are processed on our secure blockchain network, ensuring transparency and security.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className={typography.h4}>Transaction Limits</h3>
                  <ul className="space-y-2 mt-2">
                    <li className={typography.muted.base}>• Daily buy/sell limit: 10,000 TND</li>
                    <li className={typography.muted.base}>• Minimum transaction: 1 DFLOW</li>
                    <li className={typography.muted.base}>• Maximum transaction: 1,000 DFLOW</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Crypto
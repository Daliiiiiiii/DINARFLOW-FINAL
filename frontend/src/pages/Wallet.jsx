import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiWalletLine, 
  RiCoinsLine, 
  RiExchangeLine, 
  RiArrowRightUpLine, 
  RiArrowLeftDownLine,
  RiHistoryLine,
  RiQrCodeLine,
  RiAddLine,
  RiSubtractLine,
  RiBankCardLine,
  RiBankLine,
  RiArrowRightLine,
  RiUserLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiTimeLine
} from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../contexts/TransactionContext'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'
import ActionLoader from '../assets/animations/ActionLoader'

const Wallet = () => {
  const { userProfile } = useAuth()
  const { transactions = [], cryptoRate = 0.25, loading } = useTransactions()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState('all')
  const [showTopUpOptions, setShowTopUpOptions] = useState(false)
  const [hoveredAction, setHoveredAction] = useState(null)
  const [showSendOptions, setShowSendOptions] = useState(false)
  
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

  // Show loading state
  if (loading) {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl overflow-hidden`}
      >
        <div className="px-6 pt-6 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>{t('wallet.totalBalance')}</h2>
              <p className="text-4xl font-semibold">{totalValue.toFixed(2)} TND</p>
              <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                {t('wallet.lastUpdated')}: {new Date().toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <RiWalletLine className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
            
        <div className={`px-6 py-4 ${
          isDark 
            ? 'bg-gray-800/50' 
            : 'bg-gray-50'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-green-600/20 rounded-lg mr-3">
              <RiShieldCheckLine className="text-green-400" size={16} />
            </div>
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{t('wallet.secureTransactions')}</span>
          </div>
        </div>
        <div className={`px-6 py-4 ${
          isDark 
            ? 'bg-gray-800/50' 
            : 'bg-gray-50'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
              <RiTimeLine className="text-blue-400" size={16} />
            </div>
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{t('wallet.realTimeUpdates')}</span>
          </div>
        </div>
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TND Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                <RiWalletLine className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>{t('wallet.tndBalance')}</h3>
                <p className="text-2xl font-semibold">
                  {userProfile?.walletBalance?.toFixed(2) || '0.00'} TND
                </p>
              </div>
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              icon={<RiArrowRightUpLine size={18} />}
              onClick={() => setShowSendOptions(!showSendOptions)}
            >
              {t('wallet.send')}
            </Button>
            <Button
              variant="success"
              icon={<RiAddLine size={18} />}
              onClick={() => setShowTopUpOptions(!showTopUpOptions)}
            >
              {t('wallet.topUp')}
            </Button>
          </div>
                
          <AnimatePresence>
            {showSendOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-2"
              >
                <Link 
                  to="/transfer" 
                  className={`flex items-center p-3 rounded-xl ${
                    isDark 
                      ? 'hover:bg-gray-800/50' 
                      : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                    <RiUserLine className="text-blue-400" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>{t('wallet.sendToUser')}</h4>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{t('wallet.transferToUser')}</p>
                  </div>
                  <RiArrowRightLine className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                </Link>
                  
                <Link 
                  to="/bank-transfer"
                  className={`flex items-center p-3 rounded-xl ${
                    isDark 
                      ? 'hover:bg-gray-800/50' 
                      : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                    <RiBankLine className="text-blue-400" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>{t('wallet.bankTransfer')}</h4>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{t('wallet.sendToBank')}</p>
                  </div>
                  <RiArrowRightLine className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTopUpOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-2"
              >
                <Link 
                  to="/top-up"
                  className={`flex items-center p-3 rounded-xl ${
                    isDark 
                      ? 'hover:bg-gray-800/50' 
                      : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="p-2 bg-green-600/20 rounded-lg mr-3">
                    <RiBankCardLine className="text-green-400" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>{t('wallet.creditDebitCard')}</h4>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{t('wallet.instantTopUp')}</p>
                  </div>
                  <RiArrowRightLine className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                </Link>
                  
                <Link 
                  to="/bank-transfer"
                  className={`flex items-center p-3 rounded-xl ${
                    isDark 
                      ? 'hover:bg-gray-800/50' 
                      : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                    <RiBankLine className="text-blue-400" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>{t('wallet.bankTransfer')}</h4>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{t('wallet.sendToBank')}</p>
                  </div>
                  <RiArrowRightLine className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Crypto Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600/20 rounded-lg mr-3">
                <RiCoinsLine className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>{t('wallet.dflowBalance')}</h3>
                <p className="text-2xl font-semibold">
                  {userProfile?.cryptoBalance?.toFixed(2) || '0.00'} DFLOW
                </p>
              </div>
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              icon={<RiArrowRightUpLine size={18} />}
              onClick={() => setShowSendOptions(!showSendOptions)}
            >
              {t('wallet.send')}
            </Button>
            <Button
              variant="success"
              icon={<RiAddLine size={18} />}
              onClick={() => setShowTopUpOptions(!showTopUpOptions)}
            >
              {t('wallet.buy')}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{t('wallet.recentTransactions')}</h3>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
            >
              {t('wallet.all')}
            </Button>
            <Button
              variant={activeTab === 'tnd' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('tnd')}
            >
              TND
            </Button>
            <Button
              variant={activeTab === 'crypto' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('crypto')}
            >
              DFLOW
            </Button>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <motion.div
                key={tx.id || tx._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center p-4 rounded-xl ${
                  isDark 
                    ? 'bg-gray-800/50 hover:bg-gray-800' 
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className={`p-2 rounded-lg mr-4 ${
                  tx.subtype === 'send' 
                    ? 'bg-red-600/20' 
                    : 'bg-green-600/20'
                }`}>
                  {tx.subtype === 'send' ? (
                    <RiArrowRightUpLine className="text-red-400" size={20} />
                  ) : (
                    <RiArrowLeftDownLine className="text-green-400" size={20} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium`}>
                    {tx.description || tx.type || t('wallet.transaction')}
                  </h4>
                  <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.amount < 0 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount || 0).toFixed(2)} {tx.currency || 'TND'}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === 'completed' 
                      ? 'bg-green-600/20 text-green-400'
                      : tx.status === 'pending'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-red-600/20 text-red-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="py-12 text-center"
          >
            <div className={`p-4 bg-gray-600/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
              <RiHistoryLine className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={24} />
            </div>
            <h3 className={`${isDark ? 'text-gray-300' : 'text-gray-900'} font-medium mb-2`}>{t('wallet.noTransactions')}</h3>
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>{t('wallet.transactionHistory')}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default Wallet
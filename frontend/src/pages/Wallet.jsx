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
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'

const Wallet = () => {
  const { userProfile } = useAuth()
  const { transactions = [], cryptoRate = 0.25, loading } = useTransactions()
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center h-64"
      >
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-4">
            <RiWalletLine className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h1 className={typography.h1}>My Wallet</h1>
            <p className={typography.muted.base}>Manage your funds and transactions</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<RiRefreshLine size={16} />}
            onClick={() => window.location.reload()}
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

      {/* Total Balance Card */}
      <Card variant="gradient" className="overflow-hidden">
        <div className="px-6 pt-6 pb-8">
              <div className="flex justify-between items-start">
                <div>
              <h2 className={typography.h3}>Total Balance</h2>
              <p className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">{totalValue.toFixed(2)} TND</p>
              <p className={`mt-2 ${typography.muted.sm}`}>
                    Last updated: {new Date().toLocaleString()}
                  </p>
                </div>
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <RiWalletLine className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
              </div>
            </div>
            
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="px-6 py-4">
            <div className="flex items-center">
              <RiShieldCheckLine className="mr-2 text-primary-600 dark:text-primary-400" size={16} />
              <span className={typography.muted.sm}>Secure Transactions</span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center">
              <RiTimeLine className="mr-2 text-primary-600 dark:text-primary-400" size={16} />
              <span className={typography.muted.sm}>Real-time Updates</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TND Balance */}
        <Card>
              <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-3">
                  <RiWalletLine className="text-primary-600 dark:text-primary-400" size={20} />
                  </div>
                  <div>
                  <h3 className={typography.muted.base}>TND Balance</h3>
                  <p className={typography.h3}>
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
                Send
              </Button>
              <Button
                variant="secondary"
                icon={<RiAddLine size={18} />}
                onClick={() => setShowTopUpOptions(!showTopUpOptions)}
              >
                Top Up
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
                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-3">
                      <RiUserLine className="text-primary-600 dark:text-primary-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className={typography.body.base}>Send to User</h4>
                      <p className={typography.muted.sm}>Transfer to another user</p>
                    </div>
                    <RiArrowRightLine className="text-gray-400" size={18} />
                  </Link>
                  
                  <Link 
                    to="/bank-transfer"
                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                      <RiBankLine className="text-blue-600 dark:text-blue-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className={typography.body.base}>Bank Transfer</h4>
                      <p className={typography.muted.sm}>Send to bank account</p>
                    </div>
                    <RiArrowRightLine className="text-gray-400" size={18} />
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
                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-3">
                      <RiBankCardLine className="text-green-600 dark:text-green-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className={typography.body.base}>Credit/Debit Card</h4>
                      <p className={typography.muted.sm}>Instant top-up with card</p>
                    </div>
                    <RiArrowRightLine className="text-gray-400" size={18} />
                  </Link>
                  
                  <Link 
                    to="/bank-transfer"
                    className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                      <RiBankLine className="text-blue-600 dark:text-blue-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className={typography.body.base}>Bank Transfer</h4>
                      <p className={typography.muted.sm}>Top up via bank transfer</p>
                    </div>
                    <RiArrowRightLine className="text-gray-400" size={18} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Crypto Balance */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mr-3">
                  <RiCoinsLine className="text-accent-600 dark:text-accent-400" size={20} />
                </div>
                <div>
                  <h3 className={typography.muted.base}>DFLOW Balance</h3>
                  <p className={typography.h3}>
                    {userProfile?.cryptoBalance?.toFixed(4) || '0.0000'} DFLOW
                  </p>
                  <p className={typography.muted.sm}>
                    ≈ {((userProfile?.cryptoBalance || 0) * cryptoRate).toFixed(2)} TND
                  </p>
                </div>
              </div>
            </div>
                
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="accent"
                icon={<RiArrowRightUpLine size={18} />}
                onClick={() => navigate('/crypto')}
              >
                Send
              </Button>
              <Button
                variant="secondary"
                icon={<RiExchangeLine size={18} />}
                onClick={() => navigate('/crypto')}
              >
                Trade
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className={typography.muted.base}>Current Rate</span>
              <span className={typography.body.base}>1 DFLOW = {cryptoRate} TND</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/transfer">
          <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-3">
                <RiArrowRightUpLine className="text-primary-600 dark:text-primary-400" size={20} />
              </div>
              <div className="flex-1">
                <h4 className={typography.body.base}>Send TND</h4>
                <p className={typography.muted.sm}>Transfer to another user</p>
              </div>
              <RiArrowRightLine className="text-gray-400 group-hover:translate-x-1 transition-transform" size={18} />
            </div>
          </Card>
        </Link>

        <Link to="/crypto">
          <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mr-3">
                <RiExchangeLine className="text-accent-600 dark:text-accent-400" size={20} />
              </div>
              <div className="flex-1">
                <h4 className={typography.body.base}>Buy/Sell DFLOW</h4>
                <p className={typography.muted.sm}>Trade cryptocurrency</p>
              </div>
              <RiArrowRightLine className="text-gray-400 group-hover:translate-x-1 transition-transform" size={18} />
            </div>
          </Card>
        </Link>

        <Link to="/qr">
          <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-3">
                <RiQrCodeLine className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div className="flex-1">
                <h4 className={typography.body.base}>QR Code</h4>
                <p className={typography.muted.sm}>Receive payments</p>
              </div>
              <RiArrowRightLine className="text-gray-400 group-hover:translate-x-1 transition-transform" size={18} />
            </div>
          </Card>
        </Link>

        <Link to="/history">
          <Card className="group hover:shadow-lg transition-all duration-200">
            <div className="p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-3">
                <RiHistoryLine className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div className="flex-1">
                <h4 className={typography.body.base}>Transaction History</h4>
                <p className={typography.muted.sm}>View all transactions</p>
              </div>
              <RiArrowRightLine className="text-gray-400 group-hover:translate-x-1 transition-transform" size={18} />
            </div>
          </Card>
              </Link>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className={typography.h3}>Recent Transactions</h3>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All
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
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentTransactions.map((tx) => (
                <div key={tx.id || tx._id} className="py-4 group">
                    <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mr-3">
                        {tx.subtype === 'send' ? (
                        <RiArrowRightUpLine size={20} className="text-red-500" />
                        ) : (
                        <RiArrowLeftDownLine size={20} className="text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                      <p className={typography.body.base}>
                        {tx.description || tx.type || 'Transaction'}
                        </p>
                      <p className={typography.muted.sm}>
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                      <p className={`font-medium ${tx.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount || 0).toFixed(2)} {tx.currency || 'TND'}
                        </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiHistoryLine className="text-gray-400" size={24} />
              </div>
              <h3 className={typography.h4}>No transactions yet</h3>
              <p className={typography.muted.base}>Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default Wallet
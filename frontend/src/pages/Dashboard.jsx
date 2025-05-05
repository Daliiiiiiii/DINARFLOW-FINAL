import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../contexts/TransactionContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import StatsCard from '../components/StatsCard'
import ActivityChart from '../components/ActivityChart'
import TransactionsList from '../components/financial/TransactionsList'
import KycBanner from '../components/ui/KycBanner'
import { 
  RiWalletLine, 
  RiExchangeDollarLine, 
  RiArrowUpLine, 
  RiArrowDownLine,
  RiBarChartLine,
  RiRefreshLine
} from 'react-icons/ri'

const Dashboard = () => {
  const { currentUser } = useAuth()
  const { transactions, fetchTransactions, isLoading } = useTransactions()
  const [timeframe, setTimeframe] = useState('week')
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSent: 0,
    totalReceived: 0,
    avgValue: 0
  })

  useEffect(() => {
    calculateStats()
  }, [transactions, timeframe])
  
  const calculateStats = () => {
    if (!transactions.length) return

    const now = new Date()
    let cutoffDate = new Date()
    
    switch(timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        cutoffDate.setDate(now.getDate() - 7)
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.timestamp) >= cutoffDate
    )

    const sent = filteredTransactions
      .filter(t => t.type === 'sent')
      .reduce((acc, t) => acc + t.amount, 0)
    
    const received = filteredTransactions
      .filter(t => t.type === 'received')
      .reduce((acc, t) => acc + t.amount, 0)

    setStats({
      totalTransactions: filteredTransactions.length,
      totalSent: sent,
      totalReceived: received,
      avgValue: filteredTransactions.length ? 
        (sent + received) / filteredTransactions.length : 0
    })
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto space-y-6 pb-8"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome back, {currentUser.displayName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Here's what's happening with your account
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchTransactions()}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RiRefreshLine className={`${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* KYC Banner */}
      {!currentUser.isKYCVerified && <KycBanner />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={<RiBarChartLine className="text-primary-600 dark:text-primary-400" size={24} />}
          trend={{
            value: '+12.5%',
            label: 'vs. last period',
            isPositive: true
          }}
        />
          <StatsCard 
            title="Total Sent"
          value={stats.totalSent}
          valuePrefix="TND"
          icon={<RiArrowUpLine className="text-red-600 dark:text-red-400" size={24} />}
          trend={{
            value: '-8.1%',
            label: 'vs. last period',
            isPositive: false
          }}
        />
          <StatsCard 
          title="Total Received"
          value={stats.totalReceived}
          valuePrefix="TND"
          icon={<RiArrowDownLine className="text-green-600 dark:text-green-400" size={24} />}
          trend={{
            value: '+23.1%',
            label: 'vs. last period',
            isPositive: true
          }}
        />
          <StatsCard 
          title="Average Value"
          value={stats.avgValue}
          valuePrefix="TND"
          icon={<RiExchangeDollarLine className="text-blue-600 dark:text-blue-400" size={24} />}
          trend={{
            value: '+4.3%',
            label: 'vs. last period',
            isPositive: true
          }}
          />
        </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Activity Overview
              </h2>
              <div className="flex items-center space-x-2">
                {['week', 'month', 'year'].map((period) => (
                  <Button
                    key={period}
                    variant={timeframe === period ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeframe(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                ))}
        </div>
      </div>
          </Card.Header>
          <Card.Content>
            <div className="h-[300px]">
              <ActivityChart data={transactions} timeframe={timeframe} />
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Quick Actions
            </h2>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              href="/wallet"
            >
              <RiWalletLine className="mr-2" />
              View Wallet
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              href="/transfer"
            >
              <RiExchangeDollarLine className="mr-2" />
              New Transfer
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Recent Transactions
              </h2>
              <Button variant="link" href="/history">
                View All
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
        <TransactionsList 
              transactions={transactions.slice(0, 5)}
              isLoading={isLoading}
        />
          </Card.Content>
        </Card>
      </div>
    </motion.div>
  )
}

export default Dashboard
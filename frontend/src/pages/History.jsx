import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTransactions } from '../contexts/TransactionContext'
import TransactionsList from '../components/financial/TransactionsList'
import { 
  RiHistoryLine, 
  RiFilterLine,
  RiSearchLine,
  RiCalendarLine,
  RiRefreshLine,
  RiFileDownloadLine,
  RiCloseLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'

const History = () => {
  const { transactions = [], loading, getFilteredTransactions } = useTransactions()
  const [filters, setFilters] = useState({
    type: '',
    subtype: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Apply filters to get filtered transactions
  const filteredTransactions = loading ? [] : getFilteredTransactions(filters)

  // Calculate transaction stats
  const stats = {
    total: filteredTransactions.length,
    sent: filteredTransactions.filter(tx => tx.subtype === 'send').length,
    received: filteredTransactions.filter(tx => tx.subtype === 'receive').length,
    totalVolume: filteredTransactions.reduce((acc, tx) => acc + Math.abs(tx.amount || 0), 0)
  }
  
  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      type: '',
      subtype: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  // Handle export
  const handleExport = () => {
    // Implementation for exporting transactions
    console.log('Export transactions')
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
            <RiHistoryLine className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h1 className={typography.h1}>Transaction History</h1>
            <p className={typography.muted.base}>View and filter all your transaction history in one place</p>
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
            icon={<RiFileDownloadLine size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={typography.muted.base}>Total Transactions</h3>
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <RiHistoryLine className="text-primary-600 dark:text-primary-400" size={16} />
              </div>
            </div>
            <p className={typography.h2}>{stats.total}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={typography.muted.base}>Sent</h3>
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <RiArrowUpLine className="text-red-600 dark:text-red-400" size={16} />
              </div>
            </div>
            <p className={typography.h2}>{stats.sent}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={typography.muted.base}>Received</h3>
              <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <RiArrowDownLine className="text-green-600 dark:text-green-400" size={16} />
              </div>
            </div>
            <p className={typography.h2}>{stats.received}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className={typography.muted.base}>Total Volume</h3>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <RiHistoryLine className="text-blue-600 dark:text-blue-400" size={16} />
              </div>
            </div>
            <p className={typography.h2}>{stats.totalVolume.toFixed(2)} TND</p>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className={typography.h3}>Filters</h3>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button
                variant={showFilters ? 'primary' : 'ghost'}
                size="sm"
                icon={<RiFilterLine size={16} />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Transaction Type */}
                  <div>
                    <label className={`block mb-2 ${typography.label}`}>
                      Transaction Type
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">All Types</option>
                      <option value="transfer">Transfer</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </div>

                  {/* Transaction Subtype */}
                  <div>
                    <label className={`block mb-2 ${typography.label}`}>
                      Transaction Subtype
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                      value={filters.subtype}
                      onChange={(e) => setFilters(prev => ({ ...prev, subtype: e.target.value }))}
                    >
                      <option value="">All Subtypes</option>
                      <option value="send">Send</option>
                      <option value="receive">Receive</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className={`block mb-2 ${typography.label}`}>
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div>
                    <label className={`block mb-2 ${typography.label}`}>
                      Amount Range (TND)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        value={filters.minAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Transactions List */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className={typography.h3}>Transactions</h3>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                icon={sortOrder === 'asc' ? <RiArrowUpLine size={16} /> : <RiArrowDownLine size={16} />}
              >
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <TransactionsList transactions={filteredTransactions} sortOrder={sortOrder} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiHistoryLine className="text-gray-400" size={24} />
              </div>
              <h3 className={typography.h4}>No transactions found</h3>
              <p className={typography.muted.base}>Try adjusting your filters to see more results</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default History
import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiArrowRightUpLine, 
  RiArrowLeftDownLine,
  RiExchangeLine,
  RiCoinsLine,
  RiSearchLine,
  RiFilter3Line,
  RiLoader4Line,
  RiInformationLine
} from 'react-icons/ri'
import { useTranslation } from 'react-i18next'

const TransactionsList = ({ transactions = [], isLoading = false, showSearch = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [page, setPage] = useState(1)
  const { t } = useTranslation()
  const pageSize = 5
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RiLoader4Line className="w-8 h-8 text-primary-500 dark:text-primary-400 animate-spin" />
      </div>
    )
  }
  
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <RiInformationLine className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No transactions yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Your transaction history will appear here
        </p>
      </div>
    )
  }
  
  // Filter transactions based on search term and selected type
  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction || typeof transaction !== 'object') return false
    
    const searchMatch = !showSearch || searchTerm === '' || 
      ((transaction?.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction?.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction?.sender_email?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false)
    
    if (!transaction?.type || !transaction?.subtype) return false

    const typeMatch = selectedType === 'all' || 
      (selectedType === 'send' && transaction?.subtype === 'send') ||
      (selectedType === 'receive' && transaction?.subtype === 'receive') ||
      (selectedType === 'crypto' && (transaction?.type === 'crypto' || transaction?.type === 'crypto_transfer'))
    
    return searchMatch && typeMatch
  })
  
  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize)
  
  // Get transaction icon based on type and subtype
  const getTransactionIcon = (transaction) => {
    // Return default icon if transaction is null, undefined, or not an object
    if (!transaction || typeof transaction !== 'object' || !transaction.type) {
      return <RiExchangeLine size={18} className="text-gray-400 dark:text-gray-500" />
    }

    const type = transaction.type
    const subtype = transaction.subtype

    switch (type) {
      case 'transfer':
        return subtype === 'send' 
          ? <RiArrowRightUpLine size={18} className="text-red-500 dark:text-red-400" />
          : <RiArrowLeftDownLine size={18} className="text-green-500 dark:text-green-400" />
      case 'crypto':
      case 'crypto_transfer':
        return <RiCoinsLine size={18} className="text-accent-500 dark:text-accent-400" />
      default:
        return <RiExchangeLine size={18} className="text-primary-500 dark:text-primary-400" />
    }
  }
  
  // Format amount with currency
  const formatAmount = (transaction) => {
    if (!transaction || typeof transaction !== 'object' || !transaction?.amount || typeof transaction?.amount !== 'number') {
      return <span className="text-gray-400 dark:text-gray-500">N/A</span>
    }

    const amount = Math.abs(transaction.amount)
    const currency = transaction?.currency === 'TND' ? 'TND' : 'USDT'
    const isNegative = transaction.amount < 0
    
    return (
      <span className={isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
        {isNegative ? '-' : '+'}{amount.toFixed(2)} {currency}
      </span>
    )
  }
  
  // Format transaction date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Processing...'
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return format(date, 'MMM d, yyyy • h:mm a')
    } catch (error) {
      return 'Invalid date'
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card">
      {showSearch && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Transactions</h3>
          
          <div className="flex items-center space-x-2">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <RiSearchLine size={16} />
              </div>
            </div>
            
            {/* Filter button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border ${
                  showFilters 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <RiFilter3Line size={20} />
            </button>
          </div>
        </div>
        
        {/* Filter options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3"
            >
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    selectedType === 'all' 
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('history.all')}
                </button>
                <button
                  onClick={() => setSelectedType('send')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    selectedType === 'send' 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('history.sent')}
                </button>
                <button
                  onClick={() => setSelectedType('receive')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    selectedType === 'receive' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('history.received')}
                </button>
                <button
                  onClick={() => setSelectedType('crypto')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    selectedType === 'crypto' 
                        ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('history.crypto')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[460px] overflow-y-auto">
        {paginatedTransactions.length > 0 ? (
          paginatedTransactions.map((transaction) => (
            <motion.div 
              key={transaction?.id || Math.random()} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                  {getTransactionIcon(transaction)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {t(`history.${transaction?.type}`)}{transaction?.subtype ? ` (${t('history.' + transaction.subtype)})` : ''}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="truncate">
                      {transaction?.reference || 'No reference'}
                    </span>
                    <span className="hidden sm:inline mx-2">•</span>
                    <span>{formatDate(transaction?.created_at || transaction?.timestamp)}</span>
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <p className="font-medium">
                    {formatAmount(transaction)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {transaction?.status || 'Unknown'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('history.noTransactions')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('history.tryAdjustingFilters')}</p>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TransactionsList
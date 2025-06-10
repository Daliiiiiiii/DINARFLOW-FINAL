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
  RiArrowDownLine,
  RiBankLine,
  RiVisaLine,
  RiExchangeLine,
  RiArrowLeftSLine,
  RiArrowRightSLine
} from 'react-icons/ri'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { typography } from '../styles/typography'
import { useTranslation } from 'react-i18next'
import ActionLoader from '../assets/animations/ActionLoader'
import KYCOverlay from '../layouts/KYCOverlay'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import { autoTable } from 'jspdf-autotable'

const History = () => {
  const { transactions = [], loading, getFilteredTransactions } = useTransactions()
  const { currentUser } = useAuth()
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { t, i18n } = useTranslation()
  
  // Show KYCOverlay if user is not verified
  const showKycOverlay = currentUser && currentUser.kyc?.status !== 'verified';
  const kycStatus = currentUser?.kyc?.status || 'unverified';
  const rejectionReason = currentUser?.kyc?.verificationNotes || '';
  
  // Apply filters to get filtered transactions
  const filteredTransactions = loading ? [] : getFilteredTransactions({
    ...filters,
    userId: currentUser?._id
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Calculate transaction stats
  const stats = {
    total: filteredTransactions.length,
    sent: filteredTransactions.filter(tx => tx.subtype === 'send').length,
    received: filteredTransactions.filter(tx => tx.subtype === 'receive').length,
    totalVolume: filteredTransactions.reduce((acc, tx) => acc + Math.abs(tx.amount || 0), 0)
  }

  // Get transaction icon based on type and metadata
  const getTransactionIcon = (type, metadata, subtype) => {
    switch (type?.toLowerCase()) {
      case 'transfer':
        if (metadata?.bankAccountId) {
          return <RiBankLine className="w-5 h-5" />;
        }
        if (metadata?.cardDetails) {
          return <RiVisaLine className="w-5 h-5" />;
        }
        if (subtype === 'send') {
          return <RiArrowUpLine className="w-5 h-5" />;
        }
        if (subtype === 'receive') {
          return <RiArrowDownLine className="w-5 h-5" />;
        }
        return <RiExchangeLine className="w-5 h-5" />;
      default:
        return <RiHistoryLine className="w-5 h-5" />;
    }
  };

  // Get transaction type display text
  const getTransactionType = (type, metadata) => {
    if (type?.toLowerCase() === 'transfer') {
      if (metadata?.bankAccountId) {
        return 'Bank Transfer';
      }
      if (metadata?.cardDetails) {
        return 'Card Top Up';
      }
      return 'Transfer';
    }
    return type;
  };
  
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
    const doc = new jsPDF();

    // Project Name and Logo
    const projectName = "DinarFlow"; // Project name from package.json
    // Add your logo as a base64 encoded string here (PNG or JPEG format is recommended)
    // You can convert your logo image to base64 online or using tools
    const logoBase64 = ""; // <-- Paste your logo base64 string here (e.g., 'data:image/png;base64,iVBORw0KGgo...')

    // Add logo if available
    if (logoBase64) {
      // Adjust position and size as needed
      doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30); // Format should match your base64 image type (e.g., 'JPEG')
    }

    // Add title
    // Adjust position based on whether logo is present
    doc.setFontSize(18);
    doc.text(t('history.title'), logoBase64 ? 50 : 14, 25);

    // Define columns for the table
    const columns = [t('history.date'), t('history.type'), t('history.participant'), t('history.amount'), t('history.status')];

    // Map transactions to rows
    const rows = filteredTransactions.map(transaction => {
      let participantInfo = '';

      // Handle crypto transactions first
      if (transaction.type === 'crypto') {
        // Log metadata for crypto transactions to inspect
        console.log('Crypto transaction metadata:', transaction.metadata);

        const network = transaction.metadata?.network || 'Unknown Network';
        let addressInfo = '';

        if (transaction.subtype === 'receive') {
          addressInfo = transaction.metadata?.fromAddress;
        } else if (transaction.subtype === 'send') {
          addressInfo = transaction.metadata?.toAddress;
        }

        if (addressInfo) {
          participantInfo = `${transaction.subtype === 'receive' ? t('history.fromAddress') : t('history.toAddress')}: ${addressInfo} (${network})`;
        } else if (transaction.metadata?.txid) {
           // Fallback to txid if address is not found, though address should be preferred.
           // This part might be redundant based on current metadata structure but kept for robustness.
           participantInfo = `${transaction.subtype === 'receive' ? t('history.fromAddress') : t('history.toAddress')}: TXID ${transaction.metadata.txid} (${network})`;
        } else {
          // Fallback if neither fromAddress/toAddress nor txid is available
          const addressLabel = transaction.subtype === 'receive' ? t('history.fromAddress') : t('history.toAddress');
          const fallbackTranslation = t('history.addressNotAvailable');
          participantInfo = `${addressLabel}: ${fallbackTranslation} (${network})`;
        }
      } else if (transaction.subtype === 'send') {
        // Prioritize recipientFullName, then metadata.recipientName, then identifier, fallback to generic
        const recipient = transaction.recipientFullName || transaction.metadata?.recipientName || transaction.metadata?.recipientIdentifier || t('history.otherParty');
        participantInfo = `${t('history.to')}: ${recipient}`;
      } else if (transaction.subtype === 'receive') {
        // Prioritize senderFullName, then metadata.senderName, then identifier, fallback to generic
        const sender = transaction.senderFullName || transaction.metadata?.senderName || transaction.metadata?.senderIdentifier || t('history.otherParty');
        participantInfo = `${t('history.from')}: ${sender}`;
      } else if (transaction.type === 'bank') {
        // For bank transactions, show account details if available
        participantInfo = `${transaction.subtype === 'deposit' ? t('history.fromBank') : t('history.toBank')}`;
        if (transaction.metadata?.accountNumber) {
            participantInfo += `: ${transaction.metadata.accountNumber}`;
        } else if (transaction.metadata?.bankName) {
            participantInfo += `: ${transaction.metadata.bankName}`;
        }
      }

      return [
        format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a'),
        getTransactionType(transaction.type, transaction.metadata),
        participantInfo,
        `${transaction.amount > 0 ? '+' : ''}${transaction.amount} ${transaction.currency || 'TND'}`,
        transaction.status || 'Completed'
      ];
    });

    console.log('Filtered transactions for export:', filteredTransactions);
    console.log('Rows data for autoTable:', rows);

    try {
      // Add the table using autoTable plugin with enhanced styling
      if (typeof autoTable === 'function') {
          autoTable(doc, {
              head: [columns],
              body: rows,
              startY: logoBase64 ? 45 : 30, // Adjust startY based on whether logo is present
              theme: 'striped', // Use striped theme for professional look
              headStyles: { // Style for the table header
                fillColor: [22, 160, 133], // Example primary color (teal)
                textColor: 255, // White text
                fontStyle: 'bold'
              },
              bodyStyles: { // Style for the table body
                textColor: 50
              },
              alternateRowStyles: { // Style for alternate rows
                fillColor: [245, 245, 245] // Light grey for stripes
              },
              // columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 'auto' }, 4: { cellWidth: 'auto' } } // Auto-calculate column widths
          });
      } else if (typeof doc.autoTable === 'function') {
          // Fallback with basic styling if direct autoTable import fails
          doc.autoTable(columns, rows, {
              startY: logoBase64 ? 45 : 30,
              theme: 'striped',
              headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
              bodyStyles: { textColor: 50 },
              alternateRowStyles: { fillColor: [245, 245, 245] }
          });
      } else {
        console.error("Error: jspdf-autotable plugin not loaded correctly.");
        // You might want to show a user-friendly error message here
      }

      // Save the PDF
      doc.save('transaction-history.pdf');
    } catch (error) {
      console.error("Error generating or saving PDF:", error);
    }
  };
  
  return (
    <>
      <ActionLoader isLoading={loading} />
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={typography.h1}>{t('history.title')}</h1>
            <p className={typography.muted.base}>{t('history.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              icon={<RiFileDownloadLine size={16} />}
            >
              {t('history.export')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<RiFilterLine size={16} />}
            >
              {t('history.filters')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="transparent">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className={typography.muted.base}>{t('history.totalTransactions')}</h3>
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <RiHistoryLine className="text-primary-600 dark:text-primary-400" size={16} />
                </div>
              </div>
              <p className={typography.h2}>{stats.total}</p>
            </div>
          </Card>

          <Card variant="transparent">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className={typography.muted.base}>{t('history.sent')}</h3>
                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <RiArrowUpLine className="text-red-600 dark:text-red-400" size={16} />
                </div>
              </div>
              <p className={typography.h2}>{stats.sent}</p>
            </div>
          </Card>

          <Card variant="transparent">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className={typography.muted.base}>{t('history.received')}</h3>
                <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <RiArrowDownLine className="text-green-600 dark:text-green-400" size={16} />
                </div>
              </div>
              <p className={typography.h2}>{stats.received}</p>
            </div>
          </Card>

          <Card variant="transparent">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className={typography.muted.base}>{t('history.totalVolume')}</h3>
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <RiExchangeLine className="text-blue-600 dark:text-blue-400" size={16} />
                </div>
              </div>
              <p className={typography.h2}>{stats.totalVolume.toFixed(2)} TND</p>
            </div>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={typography.h3}>{t('history.filters')}</h3>
              {showFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  icon={<RiCloseLine size={16} />}
                >
                  {t('history.resetFilters')}
                </Button>
              )}
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
                        {t('history.transactionType')}
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="">{t('history.allTypes')}</option>
                        <option value="transfer">{t('history.transfer')}</option>
                        <option value="bank">{t('history.bank')}</option>
                        <option value="crypto">{t('history.crypto')}</option>
                        <option value="topup">{t('history.topup')}</option>
                      </select>
                    </div>

                    {/* Transaction Subtype */}
                    <div>
                      <label className={`block mb-2 ${typography.label}`}>
                        {t('history.transactionSubtype')}
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                        value={filters.subtype}
                        onChange={(e) => setFilters(prev => ({ ...prev, subtype: e.target.value }))}
                      >
                        <option value="">{t('history.allSubtypes')}</option>
                        <option value="send">{t('history.send')}</option>
                        <option value="receive">{t('history.receive')}</option>
                        <option value="deposit">{t('history.deposit')}</option>
                        <option value="withdrawal">{t('history.withdrawal')}</option>
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className={`block mb-2 ${typography.label}`}>
                        {t('history.dateRange')}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <input
                            type="date"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="date"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amount Range */}
                    <div>
                      <label className={`block mb-2 ${typography.label}`}>
                        {t('history.amountRange')}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                          <button type="button" className="px-3 py-2 text-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl" onClick={() => setFilters(prev => ({ ...prev, minAmount: Math.max(0, Number(prev.minAmount) - 1) }))}>-</button>
                          <input
                            type="number"
                            placeholder="Min"
                            className="w-full px-4 py-3 bg-transparent border-0 text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-0 text-center"
                            value={filters.minAmount}
                            onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                          />
                          <button type="button" className="px-3 py-2 text-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl" onClick={() => setFilters(prev => ({ ...prev, minAmount: Number(prev.minAmount) + 1 }))}>+</button>
                        </div>
                        <div className="flex items-center rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                          <button type="button" className="px-3 py-2 text-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl" onClick={() => setFilters(prev => ({ ...prev, maxAmount: Math.max(0, Number(prev.maxAmount) - 1) }))}>-</button>
                          <input
                            type="number"
                            placeholder="Max"
                            className="w-full px-4 py-3 bg-transparent border-0 text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-0 text-center"
                            value={filters.maxAmount}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                          />
                          <button type="button" className="px-3 py-2 text-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl" onClick={() => setFilters(prev => ({ ...prev, maxAmount: Number(prev.maxAmount) + 1 }))}>+</button>
                        </div>
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
              <h3 className={typography.h3}>{t('history.transactions')}</h3>
              <div className={`flex items-center gap-4 ${i18n.dir() === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                {/* Page Size Selector */}
                <select
                  className="px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                >
                  <option value="10">10 {t('history.perPage')}</option>
                  <option value="20">20 {t('history.perPage')}</option>
                  <option value="50">50 {t('history.perPage')}</option>
                  <option value="100">100 {t('history.perPage')}</option>
                </select>

                {/* Sort Order Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  icon={sortOrder === 'asc' ? <RiArrowUpLine size={16} /> : <RiArrowDownLine size={16} />}
                >
                  {sortOrder === 'asc' ? t('history.oldestFirst') : t('history.newestFirst')}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg ${
                        transaction.amount > 0 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.amount > 0 
                              ? 'bg-green-100 dark:bg-green-900/40' 
                              : 'bg-red-100 dark:bg-red-900/40'
                          }`}>
                            {getTransactionIcon(transaction.type, transaction.metadata, transaction.subtype)}
                          </div>
                          <div>
                            <p className={`font-medium ${
                              transaction.amount > 0 
                                ? 'text-green-700 dark:text-green-400' 
                                : 'text-red-700 dark:text-red-400'
                            }`}>
                              {getTransactionType(transaction.type, transaction.metadata)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.amount > 0 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-red-700 dark:text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.currency || 'TND'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.status || 'Completed'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('history.showing')} {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} {t('history.of')} {filteredTransactions.length} {t('history.transactions')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      icon={<RiArrowLeftSLine size={16} />}
                    >
                      {t('history.previous')}
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      icon={<RiArrowRightSLine size={16} />}
                    >
                      {t('history.next')}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiHistoryLine className="text-gray-400" size={24} />
                </div>
                <h3 className={typography.h4}>{t('history.noTransactions')}</h3>
                <p className={typography.muted.base}>{t('history.noResults')}</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </>
  )
}

export default History
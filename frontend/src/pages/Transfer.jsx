import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ArrowRight, 
  Users, 
  Building2, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  Search,
  X,
  CreditCard,
  ChevronRight,
  ArrowLeftRight,
  User
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import KYCOverlay from '../layouts/KYCOverlay';
import ActionLoader from '../assets/animations/ActionLoader';
import api from '../lib/axios';
import debounce from 'lodash/debounce';

// Add these animation variants at the top of the file after imports
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const buttonVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

const Transfer = () => {
  const { theme } = useTheme();
  const { transactions, fetchTransactions, loading } = useTransactions();
  const { userProfile, updateWalletBalance, updateBankBalance } = useAuth();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [transferType, setTransferType] = useState('wallet-bank');
  const [direction, setDirection] = useState('to-bank');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    note: '',
    bankAccount: '',
    bankName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientUser, setRecipientUser] = useState(null);
  const [recipientUsers, setRecipientUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [inputType, setInputType] = useState('email');
  const [showUserList, setShowUserList] = useState(false);
  const [transferStatus, setTransferStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferInProgress, setTransferInProgress] = useState(false);
  const requestPromise = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendFrom, setSendFrom] = useState('wallet'); // 'wallet' or 'bank'
  const [transferLimits, setTransferLimits] = useState({
    daily: 10000,
    weekly: 50000,
    monthly: 100000,
    perTransaction: 5000
  });
  const [bankTransferLimits, setBankTransferLimits] = useState({
    daily: 20000,
    weekly: 100000,
    monthly: 200000,
    perTransaction: 10000
  });
  const [limitsUsage, setLimitsUsage] = useState({
    transfer: { daily: 0, weekly: 0, monthly: 0 },
    bank: { daily: 0, weekly: 0, monthly: 0 }
  });
  const [limitsLoading, setLimitsLoading] = useState(true);

  // Show KYCOverlay if user is not verified
  const showKycOverlay = userProfile && userProfile.kyc?.status !== 'verified';
  const kycStatus = userProfile?.kyc?.status || 'unverified';
  const rejectionReason = userProfile?.kyc?.verificationNotes || '';

  // Clear transfer status after 5 seconds
  useEffect(() => {
    if (transferStatus) {
      const timer = setTimeout(() => {
        setTransferStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transferStatus]);

  // Debounced search function
  const searchUser = debounce(async (value) => {
    if (!value) {
      setRecipientUser(null);
      setRecipientUsers([]);
      setSearchError('');
      setShowUserList(false);
      return;
    }

    // For email search, only proceed if the email is complete (has text after the dot)
    if (value.includes('@')) {
      const [localPart, domain] = value.split('@');
      if (!domain || !domain.includes('.')) {
        setRecipientUsers([]);
        setShowUserList(false);
        return;
      }
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(value)}`);
      const users = response.data;
      
      if (users.length === 0) {
        setSearchError(t('transfer.errors.noUsersFound'));
        setRecipientUsers([]);
      } else {
        setRecipientUsers(users);
        setShowUserList(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.response?.data?.error || t('transfer.errors.searchFailed'));
      setRecipientUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    
    // If the input is empty, reset the input type
    if (!value) {
      setInputType('email');
      setFormData(prev => ({ ...prev, recipient: '' }));
      return;
    }

    // If first character is a digit, treat as phone number
    if (/^\d/.test(value)) {
      setInputType('phone');
      // Only allow digits and limit to 8 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
      setFormData(prev => ({ ...prev, recipient: digitsOnly }));
    } else if (value.includes('@')) {
      // If contains @, treat as email
      setInputType('email');
      setFormData(prev => ({ ...prev, recipient: value }));
    } else {
      // Otherwise treat as name
      setInputType('name');
      setFormData(prev => ({ ...prev, recipient: value }));
    }
    
    searchUser(value);
  };

  // Handle user selection from search results
  const handleUserSelect = (user) => {
    // Store the selected user in a more stable way
    const selectedUser = {
      ...user,
      searchType: inputType,
      formattedIdentifier: inputType === 'phone' ? user.phoneNumber.replace('+216', '') : 
                          inputType === 'email' ? user.email.toLowerCase() : 
                          user.displayName
    };
    
    // Update all states at once to prevent flickering
    setRecipientUser(selectedUser);
    setRecipientUsers([]);
    setShowUserList(false);
    setFormData(prev => ({ 
      ...prev, 
      recipient: selectedUser.formattedIdentifier
    }));
  };

  // Function to refresh recipient data
  const refreshRecipientData = async (recipientId) => {
    try {
      // Get the recipient's identifier (email or phone)
      const identifier = recipientUser?.email || recipientUser?.phoneNumber;
      if (!identifier) return;

      const response = await api.get(`/api/users/search?q=${encodeURIComponent(identifier)}`);
      const users = response.data;
      
      if (users.length > 0) {
        const updatedUser = users[0];
        
        // Update recipient in the list
        setRecipientUsers(prev => 
          prev.map(user => 
            user._id === recipientId ? updatedUser : user
          )
        );
        
        // Update selected recipient if it's the same user
        if (recipientUser && recipientUser._id === recipientId) {
          setRecipientUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error refreshing recipient data:', error);
    }
  };

  // Add direction change handler
  const handleDirectionChange = (newDirection) => {
    setDirection(newDirection);
    // Reset amount when changing direction
    setFormData(prev => ({ ...prev, amount: '' }));
  };

  // Reset amount when changing sendFrom (for user transfers)
  useEffect(() => {
    if (transferType === 'user') {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
    // eslint-disable-next-line
  }, [sendFrom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (transferType === 'user') {
      if (!formData.recipient || !formData.amount) {
        setError(t('transfer.errors.fillAllFields'));
        return;
      }
      
      if (Number(formData.amount) > userProfile.walletBalance) {
        setError(t('transfer.errors.insufficientBalance'));
        return;
      }
      
      if (Number(formData.amount) > transferLimits.perTransaction) {
        setError(`Max per transaction is ${transferLimits.perTransaction} TND`);
        return;
      }
      
      setShowConfirmation(true);
    } else {
      // Handle bank transfer validation
      if (!formData.amount) {
        setError(t('transfer.errors.fillAllFields'));
        return;
      }

      const amount = Number(formData.amount);
      
      // Check the appropriate balance based on transfer direction
      const balanceLimit = direction === 'to-bank' ? userProfile.walletBalance : userProfile.bankBalance;
      
      if (amount > balanceLimit) {
        setError(t('transfer.errors.insufficientBalance'));
        return;
      }
      
      if (amount > transferLimits.perTransaction) {
        setError(`Max per transaction is ${transferLimits.perTransaction} TND`);
        return;
      }
      
      setShowConfirmation(true);
    }
  };

  const handleConfirmTransfer = async () => {
    // Prevent multiple submissions
    if (isSubmitting || requestPromise.current) {
      console.log('[DEBUG] Transfer already in progress, ignoring request');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsProcessing(true); // Set processing state at the start
      setError('');
      setTransferStatus(null);

      if (transferType === 'user') {
        // Format the recipient based on input type
        let formattedRecipient = formData.recipient;
        if (inputType === 'phone') {
          formattedRecipient = formData.recipient.replace(/\D/g, '').slice(0, 8);
        } else if (inputType === 'email') {
          formattedRecipient = formData.recipient.toLowerCase().trim();
        }
        const transferData = {
          recipient: formattedRecipient,
          amount: Number(formData.amount),
          description: formData.note || '',
          sendFrom: sendFrom // 'wallet' or 'bank'
        };
        console.log('[DEBUG] About to POST transfer', transferData);
        const response = await api.post('/api/transactions/transfer', transferData);
        console.log('[DEBUG] Transfer success', response.data);
        
        // Update the wallet balance with the new balance from the response
        if (response.data.newBalance !== undefined) {
          updateWalletBalance(response.data.newBalance);
        }
        
        // Update recipient's data with the new balance from the response
        if (response.data.recipient) {
          const updatedRecipient = {
            ...recipientUser,
            walletBalance: response.data.recipient.walletBalance
          };
          
          // Update recipient in the list
          setRecipientUsers(prev => 
            prev.map(user => 
              user._id === response.data.recipient.id ? updatedRecipient : user
            )
          );
          
          // Update selected recipient if it's the same user
          if (recipientUser && recipientUser._id === response.data.recipient.id) {
            setRecipientUser(updatedRecipient);
          }
        }
        
        setTransferStatus({
          type: 'success',
          message: t('transfer.success.message')
        });
        
        try {
          await fetchTransactions();
        } catch (fetchErr) {
          console.error('[DEBUG] fetchTransactions error:', fetchErr);
        }
        
        setFormData({
          recipient: '',
          amount: '',
          note: '',
          bankAccount: '',
          bankName: ''
        });
        setRecipientUser(null);
        setShowConfirmation(false);
      } else {
        // Handle bank transfer
        const transferData = {
          type: direction === 'to-bank' ? 'withdrawal' : 'deposit',
          amount: Number(formData.amount),
          description: formData.note || ''
        };

        // Create a new promise for this request
        requestPromise.current = api.post('/api/transactions/bank', transferData);
        
        const response = await requestPromise.current;

        // Update both wallet and bank balances from response
        if (response.data.newWalletBalance !== undefined) {
          updateWalletBalance(response.data.newWalletBalance);
        }
        if (response.data.newBankBalance !== undefined) {
          updateBankBalance(response.data.newBankBalance);
        }

        setTransferStatus({
          type: 'success',
          message: t('transfer.success.message')
        });

        try {
          await fetchTransactions();
        } catch (fetchErr) {
          console.error('[DEBUG] fetchTransactions error:', fetchErr);
        }

        setFormData({
          recipient: '',
          amount: '',
          note: '',
          bankAccount: '',
          bankName: ''
        });
        setShowConfirmation(false);
      }
    } catch (err) {
      console.error('[DEBUG] Transfer error:', err);
      
      // Handle transaction limit errors
      if (err.response?.data?.error?.includes('exceeds')) {
        setTransferStatus({
          type: 'error',
          message: err.response.data.error
        });
        setError(err.response.data.error);
        setShowConfirmation(false);
        return;
      }
      
      // Only show error if it's not a successful transfer
      if (!err.response?.data?.success) {
        setTransferStatus({
          type: 'error',
          message: err.response?.data?.error || err.response?.data?.message || t('transfer.errors.generic')
        });
        setError(err.response?.data?.error || err.response?.data?.message || t('transfer.errors.generic'));
      } else {
        // If the transfer was successful, update balances and show success message
        if (err.response.data.newWalletBalance !== undefined) {
          updateWalletBalance(err.response.data.newWalletBalance);
        }
        if (err.response.data.newBankBalance !== undefined) {
          updateBankBalance(err.response.data.newBankBalance);
        }

        setTransferStatus({
          type: 'success',
          message: t('transfer.success.message')
        });

        try {
          await fetchTransactions();
        } catch (fetchErr) {
          console.error('[DEBUG] fetchTransactions error:', fetchErr);
        }

        setFormData({
          recipient: '',
          amount: '',
          note: '',
          bankAccount: '',
          bankName: ''
        });
        setShowConfirmation(false);
      }
    } finally {
      setIsProcessing(false); // Clear processing state at the end
      setIsSubmitting(false);
      requestPromise.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestPromise.current) {
        // Cancel any ongoing request
        requestPromise.current = null;
      }
    };
  }, []);

  const banks = [
    { name: 'Banque Nationale Agricole', account: '•••• 4589', balance: '12,450.00 TND' },
    { name: 'Attijari Bank', account: '•••• 7823', balance: '8,320.00 TND' },
    { name: 'BIAT', account: '•••• 1234', balance: '15,600.00 TND' }
  ];

  // Function to format number with fallback
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  // Function to calculate percentage with fallback
  const calculatePercentage = (used, total) => {
    if (!used || !total) return 0;
    return Math.min((Number(used) / Number(total)) * 100, 100);
  };

  // Function to fetch limits and usage
  const fetchLimitsAndUsage = useCallback(async () => {
    try {
      const [limitsRes, usageRes] = await Promise.all([
        api.get('/api/settings/transfer-limits'),
        api.get('/api/transactions/limits-usage')
      ]);
      setTransferLimits(limitsRes.data.transferLimits || {
        daily: 10000,
        weekly: 50000,
        monthly: 100000,
        perTransaction: 5000
      });
      setBankTransferLimits(limitsRes.data.bankTransferLimits || {
        daily: 20000,
        weekly: 100000,
        monthly: 200000,
        perTransaction: 10000
      });
      setLimitsUsage(usageRes.data || {
        transfer: { daily: 0, weekly: 0, monthly: 0 },
        bank: { daily: 0, weekly: 0, monthly: 0 }
      });
    } catch (err) {
      console.error('Error fetching limits:', err);
      // Keep existing values on error
    } finally {
      setLimitsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLimitsAndUsage();
  }, [fetchLimitsAndUsage]);

  // Refresh limits after successful transfer
  useEffect(() => {
    if (transferStatus?.type === 'success') {
      fetchLimitsAndUsage();
    }
  }, [transferStatus, fetchLimitsAndUsage]);

  return (
    <>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {showKycOverlay && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <KYCOverlay 
              status={kycStatus}
              rejectionReason={rejectionReason}
            />
          </motion.div>
        )}

        <motion.h1 
          className="text-2xl font-bold"
          variants={itemVariants}
        >
          {t('transfer.title')}
        </motion.h1>

        <AnimatePresence>
          {transferStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                transferStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {transferStatus.type === 'success' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
              )}
              <span>{transferStatus.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Transfer Form */}
          <motion.div 
            variants={itemVariants}
            className={`self-start ${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{t('transfer.form.details')}</h2>
            </div>

            {/* Transfer Type Selector */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setTransferType('wallet-bank')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  transferType === 'wallet-bank'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                {t('transfer.form.walletBank')}
              </button>
              <button
                onClick={() => setTransferType('user')}
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  transferType === 'user'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                {t('transfer.form.toUser')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {transferType === 'wallet-bank' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('transfer.form.transferDirection')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleDirectionChange('from-bank')}
                        className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                          direction === 'from-bank'
                            ? isDark
                              ? 'bg-green-600 text-white'
                              : 'bg-green-600 text-white'
                            : isDark
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-green-50 text-green-600'
                        }`}
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        {t('transfer.form.bankToWallet')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectionChange('to-bank')}
                        className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                          direction === 'to-bank'
                            ? isDark
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-600 text-white'
                            : isDark
                              ? 'bg-blue-900/20 text-blue-400'
                              : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        {t('transfer.form.walletToBank')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select payment method
                  </label>
                  {/* Send from button group - match wallet to bank UI */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setSendFrom('wallet')}
                      className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        sendFrom === 'wallet'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-blue-900/20 text-blue-400'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendFrom('bank')}
                      className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                        sendFrom === 'bank'
                          ? isDark
                            ? 'bg-green-600 text-white'
                            : 'bg-green-600 text-white'
                          : isDark
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-green-50 text-green-600'
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      Bank
                    </button>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter email, phone number, or username</label>
                    {inputType === 'phone' && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        +216
                      </div>
                    )}
                    <input
                      type={inputType === 'phone' ? 'text' : 'text'}
                      value={formData.recipient}
                      onChange={handleRecipientChange}
                      className={`w-full rounded-lg border ${
                        inputType === 'phone' ? 'pl-16' : 'pl-4'
                      } pr-4 py-2 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      placeholder={
                        inputType === 'phone' ? t('transfer.form.enterPhone') : 
                        inputType === 'email' ? t('transfer.form.enterEmail') :
                        t('transfer.form.enterName')
                      }
                      maxLength={inputType === 'phone' ? 8 : undefined}
                    />
                  </div>
                  
                  {/* User search results */}
                  {isSearching && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('transfer.processing')}
                    </div>
                  )}
                  
                  {searchError && (
                    <div className="mt-2 text-sm text-red-500 dark:text-red-400">
                      {searchError}
                    </div>
                  )}
                  
                  {/* User list */}
                  {showUserList && recipientUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 border rounded-lg overflow-hidden"
                    >
                      {recipientUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            isDark ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.displayName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email || user.phoneNumber}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Selected user display */}
                  {recipientUser && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        {recipientUser.profilePicture ? (
                          <img
                            src={recipientUser.profilePicture}
                            alt={recipientUser.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{recipientUser.displayName}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {recipientUser.email || recipientUser.phoneNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setRecipientUser(null);
                          setFormData({ ...formData, recipient: '' });
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-blue-500" />
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('transfer.form.amount')} (TND)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow empty value
                      if (value === '') {
                        setFormData({ ...formData, amount: '' });
                        return;
                      }
                      // Only allow numbers and one decimal point
                      if (!/^\d*\.?\d*$/.test(value)) {
                        return;
                      }
                      // Limit to 2 decimal places
                      if (value.includes('.')) {
                        const [whole, decimal] = value.split('.');
                        if (decimal && decimal.length > 2) {
                          value = `${whole}.${decimal.slice(0, 2)}`;
                        }
                      }
                      // Get the appropriate balance limit
                      let balanceLimit = userProfile.walletBalance;
                      if (transferType === 'wallet-bank') {
                        balanceLimit = direction === 'to-bank' ? userProfile.walletBalance : userProfile.bankBalance;
                      } else if (transferType === 'user') {
                        balanceLimit = sendFrom === 'wallet' ? userProfile.walletBalance : userProfile.bankBalance;
                      }
                      // Convert to number for validation
                      let num = parseFloat(value);
                      if (!isNaN(num)) {
                        // Enforce min/max
                        if (num < 0.01) return;
                        if (num > balanceLimit) {
                          value = balanceLimit.toString();
                        }
                      }
                      setFormData({ ...formData, amount: value });
                    }}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (transferType === 'wallet-bank') {
                        if (direction === 'from-bank') {
                          setFormData({ ...formData, amount: userProfile.bankBalance });
                        } else {
                          setFormData({ ...formData, amount: userProfile.walletBalance });
                        }
                      } else if (transferType === 'user') {
                        if (sendFrom === 'bank') {
                          setFormData({ ...formData, amount: userProfile.bankBalance });
                        } else {
                          setFormData({ ...formData, amount: userProfile.walletBalance });
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-all duration-200"
                  >
                    {t('transfer.form.max')}
                  </button>
                </div>
              </div>

              {transferType === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('transfer.form.note')}
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    placeholder={t('transfer.form.enterNote')}
                    rows="3"
                  />
                </div>
              )}

              {transferType === 'wallet-bank' && (
                <div className={`${
                  isDark
                    ? 'bg-blue-900/20'
                    : 'bg-blue-50'
                } p-4 rounded-lg flex items-start gap-3`}>
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{t('transfer.form.processingTime')}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{t('transfer.form.instant')}</p>
                  </div>
                </div>
              )}

              <motion.button 
                type="submit"
                disabled={isProcessing}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="w-4 h-4" />
                    </motion.div>
                    {t('transfer.processing')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('transfer.form.send')}
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <div className="space-y-6">
            {/* Account Balances */}
            <motion.div 
              variants={itemVariants}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <h2 className="text-lg font-semibold mb-4">{t('transfer.balances')}</h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">{t('transfer.walletBalance')}</span>
                  </div>
                  <div className="text-2xl font-semibold">{userProfile.walletBalance?.toFixed(2) || '0.00'} TND</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-green-400" />
                    <span className="font-medium">{t('transfer.bankBalance')}</span>
                  </div>
                  <div className="text-2xl font-semibold">{userProfile.bankBalance?.toFixed(2) || '0.00'} TND</div>
                </div>
              </div>
            </motion.div>

            {/* Transfer Limits */}
            <motion.div
              variants={itemVariants}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('transfer.limits')} (Wallet/User)</h2>
                <button 
                  onClick={fetchLimitsAndUsage}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  disabled={limitsLoading}
                >
                  <svg 
                    className={`w-4 h-4 ${limitsLoading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  {t('transfer.refresh')}
                </button>
              </div>
              <div className="space-y-4">
                {limitsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.dailyLimit')}</span>
                        <span className="font-medium">{formatNumber(transferLimits.daily)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.transfer.daily, transferLimits.daily) > 90 ? 'bg-red-500' : 'bg-blue-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.transfer.daily, transferLimits.daily)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.transfer.daily)} TND {t('transfer.used')} / {formatNumber(transferLimits.daily)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.weeklyLimit')}</span>
                        <span className="font-medium">{formatNumber(transferLimits.weekly)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.transfer.weekly, transferLimits.weekly) > 90 ? 'bg-red-500' : 'bg-blue-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.transfer.weekly, transferLimits.weekly)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.transfer.weekly)} TND {t('transfer.used')} / {formatNumber(transferLimits.weekly)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.monthlyLimit')}</span>
                        <span className="font-medium">{formatNumber(transferLimits.monthly)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.transfer.monthly, transferLimits.monthly) > 90 ? 'bg-red-500' : 'bg-blue-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.transfer.monthly, transferLimits.monthly)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.transfer.monthly)} TND {t('transfer.used')} / {formatNumber(transferLimits.monthly)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.perTransactionLimit')}</span>
                        <span className="font-medium">{formatNumber(transferLimits.perTransaction)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('transfer.maxPerTransaction')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('transfer.limits')} (Bank)</h2>
                <button 
                  onClick={fetchLimitsAndUsage}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  disabled={limitsLoading}
                >
                  <svg 
                    className={`w-4 h-4 ${limitsLoading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  {t('transfer.refresh')}
                </button>
              </div>
              <div className="space-y-4">
                {limitsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.dailyLimit')}</span>
                        <span className="font-medium">{formatNumber(bankTransferLimits.daily)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.bank.daily, bankTransferLimits.daily) > 90 ? 'bg-red-500' : 'bg-green-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.bank.daily, bankTransferLimits.daily)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.bank.daily)} TND {t('transfer.used')} / {formatNumber(bankTransferLimits.daily)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.weeklyLimit')}</span>
                        <span className="font-medium">{formatNumber(bankTransferLimits.weekly)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.bank.weekly, bankTransferLimits.weekly) > 90 ? 'bg-red-500' : 'bg-green-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.bank.weekly, bankTransferLimits.weekly)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.bank.weekly)} TND {t('transfer.used')} / {formatNumber(bankTransferLimits.weekly)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.monthlyLimit')}</span>
                        <span className="font-medium">{formatNumber(bankTransferLimits.monthly)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            calculatePercentage(limitsUsage.bank.monthly, bankTransferLimits.monthly) > 90 ? 'bg-red-500' : 'bg-green-600'
                          }`} 
                          style={{ 
                            width: `${calculatePercentage(limitsUsage.bank.monthly, bankTransferLimits.monthly)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatNumber(limitsUsage.bank.monthly)} TND {t('transfer.used')} / {formatNumber(bankTransferLimits.monthly)} TND
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.perTransactionLimit')}</span>
                        <span className="font-medium">{formatNumber(bankTransferLimits.perTransaction)} TND</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-2 bg-green-600 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('transfer.maxPerTransaction')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Recent Transfers */}
            <motion.div
              variants={itemVariants}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('transfer.recentTransfers')}</h2>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  {t('transfer.viewAll')}
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {transactions.map((transfer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          transfer.type === 'bank' ? (
                            transfer.subtype === 'withdrawal' 
                              ? 'bg-red-100 dark:bg-red-900/30' 
                              : 'bg-green-100 dark:bg-green-900/30'
                          ) : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {transfer.type === 'bank' ? (
                            transfer.subtype === 'withdrawal' ? (
                              <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )
                          ) : (
                            <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{transfer.name}</div>
                          <div className={`text-sm ${
                            transfer.type === 'bank' && transfer.subtype === 'withdrawal'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {transfer.type === 'bank' ? (
                              transfer.subtype === 'deposit' ? t('transfer.bankToWallet') :
                              transfer.subtype === 'withdrawal' ? t('transfer.walletToBank') :
                              t('transfer.bankTransfer')
                            ) : transfer.type === 'transfer' ? (
                              t('transfer.transfer')
                            ) : t('transfer.transaction')}
                          </div>
                          {transfer.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {transfer.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
                              {transfer.reference}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {transfer.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          (transfer.type === 'bank' && transfer.subtype === 'withdrawal') ||
                          (transfer.type === 'transfer' && transfer.subtype === 'send')
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {(transfer.type === 'bank' && transfer.subtype === 'withdrawal') ||
                           (transfer.type === 'transfer' && transfer.subtype === 'send')
                            ? '-' : '+'}{Math.abs(transfer.amount)} TND
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {transfer.status === 'pending' ? (
                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <Clock className="w-3 h-3" />
                              {t('transfer.pending')}
                            </span>
                          ) : transfer.status === 'failed' ? (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {t('transfer.failed')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('transfer.noRecentTransfers')}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessing && setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`${
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl shadow-xl max-w-md w-full p-6 relative`}
            >
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <ActionLoader isLoading={true} />
                </div>
              )}

              <div className={`${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">{t('transfer.confirmTransfer')}</h2>
                  <button
                    onClick={() => !isProcessing && setShowConfirmation(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    disabled={isProcessing}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className={`${
                    isDark
                      ? 'bg-yellow-900/20'
                      : 'bg-yellow-50'
                  } p-4 rounded-lg flex items-start gap-3`}>
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">{t('transfer.pleaseReview')}</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                        {t('transfer.makeSureAllDetails')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('transfer.amount')}</span>
                      <span className="font-medium">{formData.amount} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {transferType === 'wallet-bank' ? t('transfer.bankAccount') : t('transfer.recipient')}
                      </span>
                      <span className="font-medium">{formData.recipient || formData.bankAccount}</span>
                    </div>
                    {formData.note && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('transfer.note')}</span>
                        <span className="font-medium">{formData.note}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('transfer.fee')}</span>
                      <span className="font-medium">0.00 TND</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-500 dark:text-gray-400">{t('transfer.total')}</span>
                      <span className="text-xl font-semibold">{formData.amount} TND</span>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => !isProcessing && setShowConfirmation(false)}
                        disabled={isProcessing}
                        className={`flex-1 px-4 py-2 rounded-lg ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700'
                            : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {t('transfer.cancel')}
                      </motion.button>
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={handleConfirmTransfer}
                        disabled={isProcessing}
                        className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
                          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {t('transfer.confirmTransfer')}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Transfer;
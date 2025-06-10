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
      <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
        className="space-y-6"
      >
      {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
            <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className={`w-14 h-14 rounded-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-lg flex items-center justify-center relative group`}
          >
            <ArrowLeftRight className="w-7 h-7 text-blue-500" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold shadow-lg"
                >
              $
                </motion.div>
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            >
              Transfer Funds
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400"
            >
              Send money to other users or your bank account
            </motion.p>
          </div>
        </div>
                </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transfer Type Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark ? 'bg-gray-800/50' : 'bg-white'
            } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            } shadow-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Transfer Type</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTransferType('wallet-bank')}
                className={`p-4 rounded-xl border transition-all ${
                  transferType === 'wallet-bank'
                    ? isDark
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-blue-50 border-blue-500'
                    : isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                  }`}>
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Wallet to Bank</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Transfer to your bank account
                    </div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTransferType('wallet-wallet')}
                className={`p-4 rounded-xl border transition-all ${
                  transferType === 'wallet-wallet'
                    ? isDark
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-blue-50 border-blue-500'
                    : isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                  }`}>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Wallet to Wallet</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Send to another user
                  </div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTransferType('user')}
                className={`p-4 rounded-xl border transition-all ${
                  transferType === 'user'
                    ? isDark
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-blue-50 border-blue-500'
                    : isDark
                      ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                  }`}>
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">DinarFlow User</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Send to DinarFlow user
                    </div>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Send From Selection - Only show for user transfers */}
          {transferType === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Send From
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSendFrom('wallet')}
                  className={`p-4 rounded-xl border transition-all ${
                    sendFrom === 'wallet'
                      ? isDark
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-blue-50 border-blue-500'
                      : isDark
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                    }`}>
                      <Wallet className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Wallet</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {userProfile?.walletBalance || 0} USDT
                      </div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSendFrom('bank')}
                  className={`p-4 rounded-xl border transition-all ${
                    sendFrom === 'bank'
                      ? isDark
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-blue-50 border-blue-500'
                      : isDark
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                    }`}>
                      <CreditCard className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Bank Account</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {userProfile?.bankBalance || 0} USDT
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Transfer Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              isDark ? 'bg-gray-800/50' : 'bg-white'
            } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            } shadow-xl`}
          >
            <div className="space-y-6">
              {/* Recipient Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recipient
                </label>
                  <div className="relative">
                    <input
                    type="text"
                      value={formData.recipient}
                      onChange={handleRecipientChange}
                    placeholder="Enter email, phone number, or name"
                    className={`w-full p-3 rounded-xl border ${
                        isDark
                        ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500'
                        : 'bg-white border-gray-200 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500/20 transition-all`}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                    </div>
                  )}
                    </div>
                {searchError && (
                  <p className="text-sm text-red-500">{searchError}</p>
                  )}
                  {showUserList && recipientUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-y-auto"
                    >
                      {recipientUsers.map((user) => (
                      <motion.button
                          key={user._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                          onClick={() => handleUserSelect(user)}
                        className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                      ))}
                    </motion.div>
                        )}
                      </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className={`w-full p-3 rounded-xl border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500'
                        : 'bg-white border-gray-200 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500/20 transition-all`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    USDT
                  </div>
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Note (Optional)
                  </label>
                  <textarea
                    value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note to your transfer"
                  className={`w-full p-3 rounded-xl border ${
                      isDark
                      ? 'bg-gray-800/50 border-gray-700 focus:border-blue-500'
                      : 'bg-white border-gray-200 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 transition-all resize-none`}
                  rows={3}
                  />
                </div>

              {/* Submit Button */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Transfer
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Transfer Limits */}
            <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
              className={`${
            isDark ? 'bg-gray-800/50' : 'bg-white'
          } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          } shadow-xl`}
        >
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Transfer Limits</h2>
            
            {/* Daily Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Daily Limit</span>
                <span className="text-sm font-medium">
                  {formatNumber(limitsUsage.transfer.daily)} / {formatNumber(transferLimits.daily)} USDT
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatePercentage(limitsUsage.transfer.daily, transferLimits.daily)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
                  </div>

            {/* Weekly Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Weekly Limit</span>
                <span className="text-sm font-medium">
                  {formatNumber(limitsUsage.transfer.weekly)} / {formatNumber(transferLimits.weekly)} USDT
                </span>
                      </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatePercentage(limitsUsage.transfer.weekly, transferLimits.weekly)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                      </div>
                    </div>

            {/* Monthly Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Limit</span>
                <span className="text-sm font-medium">
                  {formatNumber(limitsUsage.transfer.monthly)} / {formatNumber(transferLimits.monthly)} USDT
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatePercentage(limitsUsage.transfer.monthly, transferLimits.monthly)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
                  </div>

            {/* Per Transaction Limit */}
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
              <div className="text-sm text-gray-500 dark:text-gray-400">Per Transaction Limit</div>
              <div className="text-lg font-medium mt-1">
                {formatNumber(transferLimits.perTransaction)} USDT
              </div>
                      </div>
                    </div>
                  </motion.div>
                  </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                isDark ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl p-6 w-full max-w-md shadow-2xl`}
            >
              <h2 className="text-xl font-semibold mb-4">Confirm Transfer</h2>
                <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Amount</div>
                  <div className="text-2xl font-bold mt-1">
                    {formData.amount} USDT
                    </div>
                  </div>
                <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Recipient</div>
                  <div className="font-medium mt-1">
                    {recipientUser?.displayName || formData.recipient}
                    </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {recipientUser?.email || ''}
                  </div>
                    </div>
                    {formData.note && (
                  <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700/50">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Note</div>
                    <div className="mt-1">{formData.note}</div>
                      </div>
                    )}
                    </div>
              <div className="flex gap-4 mt-6">
                      <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                      </motion.button>
                      <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmTransfer}
                        disabled={isProcessing}
                  className="flex-1 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                      </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Overlay */}
      {showKycOverlay && (
        <KYCOverlay
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}
    </motion.div>
  );
};

export default Transfer;
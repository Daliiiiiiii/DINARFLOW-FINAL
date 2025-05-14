import React, { useState, useEffect } from 'react';
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
import api from '../lib/axios';
import debounce from 'lodash/debounce';

const Transfer = () => {
  const { theme } = useTheme();
  const { transactions, fetchTransactions, loading } = useTransactions();
  const { userProfile, updateWalletBalance } = useAuth();
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

  // Show KYCOverlay if user is not verified
  const showKycOverlay = userProfile && userProfile.kyc?.status !== 'verified';
  const kycStatus = userProfile?.kyc?.status || 'unverified';
  const rejectionReason = userProfile?.kyc?.verificationNotes || '';

  // Listen for WebSocket balance updates
  useEffect(() => {
    const socket = window.socket;
    if (!socket) return;

    const handleBalanceUpdate = (data) => {
      if (data.walletBalance !== undefined) {
        // Update sender's balance
        if (data.userId === userProfile._id) {
          updateWalletBalance(data.walletBalance);
        }
        // Update recipient's balance if they are selected
        if (recipientUser && data.userId === recipientUser._id) {
          setRecipientUser(prev => ({
            ...prev,
            walletBalance: data.walletBalance
          }));
        }
      }
    };

    socket.on('balance:updated', handleBalanceUpdate);

    return () => {
      socket.off('balance:updated', handleBalanceUpdate);
    };
  }, [updateWalletBalance, userProfile._id, recipientUser]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (transferType === 'user') {
      if (!formData.recipient || !formData.amount) {
        setError(t('transfer.errors.fillAllFields'));
        return;
      }
      
      if (formData.amount > userProfile.walletBalance) {
        setError(t('transfer.errors.insufficientBalance'));
        return;
      }
      
      setShowConfirmation(true);
    } else {
      // Handle bank transfer logic here
      setShowConfirmation(true);
    }
  };

  const handleConfirmTransfer = async () => {
    if (transferType === 'user') {
      try {
        console.log('[DEBUG] Transfer started');
        setIsProcessing(true);
        setError('');
        setTransferStatus(null);
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
          description: formData.note || ''
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
        console.log('[DEBUG] transferStatus after success:', {
          type: 'success',
          message: t('transfer.success.message')
        });
        // Try/catch around fetchTransactions
        try {
          console.log('[DEBUG] Calling fetchTransactions...');
          await fetchTransactions();
          console.log('[DEBUG] fetchTransactions success');
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
        console.log('[DEBUG] Form data reset');
        setRecipientUser(null);
        setShowConfirmation(false);
        console.log('[DEBUG] Confirmation modal closed');
      } catch (err) {
        console.error('[DEBUG] Transfer error details:', {
          error: err.response?.data,
          status: err.response?.status,
          message: err.message,
          validationErrors: err.response?.data?.errors
        });
        setTransferStatus({
          type: 'error',
          message: err.response?.data?.error || err.response?.data?.message || t('transfer.errors.generic')
        });
        console.log('[DEBUG] transferStatus after error:', {
          type: 'error',
          message: err.response?.data?.error || err.response?.data?.message || t('transfer.errors.generic')
        });
        setError(err.response?.data?.error || err.response?.data?.message || t('transfer.errors.generic'));
      } finally {
        setIsProcessing(false);
        console.log('[DEBUG] Transfer finished, isProcessing:', false);
      }
    } else {
      // Handle bank transfer confirmation
      setShowConfirmation(false);
    }
  };

  const banks = [
    { name: 'Banque Nationale Agricole', account: '•••• 4589', balance: '12,450.00 TND' },
    { name: 'Attijari Bank', account: '•••• 7823', balance: '8,320.00 TND' },
    { name: 'BIAT', account: '•••• 1234', balance: '15,600.00 TND' }
  ];

  return (
    <>
    <div className="space-y-6">
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}
      <h1 className="text-2xl font-bold">{t('transfer.title')}</h1>
      
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
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
                      {t('transfer.form.bankAccount')}
                    </label>
                    {userProfile.kycStatus === 'verified' && userProfile.bankAccount ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${userProfile.bankAccount.bankName} - ${userProfile.bankAccount.accountNumber}`}
                          readOnly
                          className={`w-full px-4 py-2 rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none`}
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(userProfile.bankAccount.accountNumber)}
                          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                          title={t('common.copy')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6V5.25A2.25 2.25 0 0014.25 3h-6A2.25 2.25 0 006 5.25v13.5A2.25 2.25 0 008.25 21h6A2.25 2.25 0 0016.5 18.75V18M9.75 15.75h4.5M9.75 12.75h4.5M9.75 9.75h4.5M19.5 8.25v10.5a2.25 2.25 0 01-2.25 2.25h-6A2.25 2.25 0 019 18.75V8.25A2.25 2.25 0 0111.25 6h6A2.25 2.25 0 0119.5 8.25z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-4 py-2">
                        {t('transfer.form.kycRequired')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('transfer.form.transferDirection')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDirection('from-bank')}
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
                        onClick={() => setDirection('to-bank')}
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
                {t('transfer.form.recipient')}
              </label>
              <div className="relative">
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
                    inputType === 'phone' ? '12345678' : 
                    inputType === 'email' ? t('transfer.form.enterEmail') :
                    t('transfer.form.enterName')
                  }
                  maxLength={inputType === 'phone' ? 8 : undefined}
                />
              </div>
              
              {/* User search results */}
              {isSearching && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Searching...
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
                    type="number"
                value={formData.amount}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Remove leading zeros
                      value = value.replace(/^0+/, '');
                      // Enforce min/max
                      let num = Number(value);
                      if (value === '') num = '';
                      else if (num < 1) num = 1;
                      else if (num > userProfile.walletBalance) num = userProfile.walletBalance;
                      setFormData({ ...formData, amount: num });
                    }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                    : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                placeholder="0.00"
                min="1"
                max={userProfile.walletBalance}
              />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: userProfile.walletBalance })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-all duration-200"
                  >
                    MAX
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

            <button 
              type="submit"
              disabled={isProcessing}
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
            </button>
          </form>
        </motion.div>

          <div className="space-y-6">
            {/* Account Balances */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                  <div className="text-2xl font-semibold">{userProfile.walletBalance} TND</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-green-400" />
                    <span className="font-medium">{t('transfer.bankBalance')}</span>
                  </div>
                  <div className="text-2xl font-semibold">{userProfile.bankBalance} TND</div>
                </div>
              </div>
            </motion.div>

            {/* Transfer Limits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <h2 className="text-lg font-semibold mb-4">{t('transfer.limits')}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.dailyLimit')}</span>
                    <span className="font-medium">10,000 TND</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('transfer.dailyUsed')}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t('transfer.monthlyLimit')}</span>
                    <span className="font-medium">50,000 TND</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: '30%' }} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('transfer.monthlyUsed')}
                  </p>
            </div>
          </div>
            </motion.div>

            {/* Recent Transfers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <h2 className="text-lg font-semibold mb-4">{t('transfer.recentTransfers')}</h2>
            <div className="space-y-3">
                {transactions.map((transfer, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      {transfer.type === 'to-bank' ? (
                        <ArrowUpRight className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-green-400" />
                      )}
                      <div>
                        <div className="font-medium">{transfer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{transfer.date}</div>
                      </div>
                    </div>
                    <div className="font-medium">{transfer.amount}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmation(false)}
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
              } border rounded-xl shadow-xl max-w-md w-full p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t('transfer.confirmTransfer')}</h2>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        isDark
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {t('transfer.cancel')}
                    </button>
                    <button
                      onClick={handleConfirmTransfer}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {t('transfer.confirmTransfer')}
                    </button>
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
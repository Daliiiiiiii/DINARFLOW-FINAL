import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  Calendar,
  Mail,
  Phone,
  User,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  ArrowLeft,
  MapPin,
  Ban,
  CreditCard
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showError, showSuccess } = useNotification();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [generatingBankAccount, setGeneratingBankAccount] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    type: 'all',
    status: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchUserDetails();
    fetchUserStatus();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/admin/users/${id}`);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      showError(t('admin.failedToFetchUserDetails'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const { data } = await api.get(`/api/admin/users/status`);
      const userStatus = data.find(u => u._id === id);
      if (userStatus) {
        setIsOnline(userStatus.isOnline);
        setLastSeen(userStatus.lastSeen);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const response = await api.post(`/api/admin/kyc/${id}/approve`);
      if (response.data) {
        showSuccess(t('admin.userKYCVerifiedSuccessfully'));
        // Update the user state directly
        setUser(prev => ({
          ...prev,
          kyc: {
            ...prev.kyc,
            status: 'verified',
            reviewedAt: new Date(),
            reviewedBy: response.data.reviewedBy
          }
        }));
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else if (error.response?.status === 400) {
        showError(t('admin.kycRequestIsNotPending'));
      } else {
        showError(error.response?.data?.error || t('admin.failedToVerifyUserKYC'));
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      // Create the wallet directly
      const response = await api.post('/api/wallet/create', { userId: id });
      if (response.data) {
        showSuccess(t('admin.walletCreatedSuccessfully'));
        // Refresh user details to get updated wallet info
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      if (error.response?.status === 400) {
        showError(error.response.data.error || t('admin.failedToCreateWallet'));
      } else if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else if (error.response?.status === 403) {
        showError(t('admin.youDoNotHavePermissionToCreateWallets'));
      } else {
        showError(t('admin.failedToCreateWalletPleaseTryAgainLater'));
      }
    }
  };

  const handleReject = async () => {
    try {
      setRejecting(true);
      const response = await api.post(`/api/admin/kyc/${id}/reject`);
      if (response.data) {
        showSuccess(t('admin.userKYCRejectedSuccessfully'));
        // Update the user state directly
        setUser(prev => ({
          ...prev,
          kyc: {
            ...prev.kyc,
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: response.data.reviewedBy
          }
        }));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else if (error.response?.status === 400) {
        showError(t('admin.kycRequestIsNotPending'));
      } else {
        showError(error.response?.data?.error || t('admin.failedToRejectUserKYC'));
      }
    } finally {
      setRejecting(false);
    }
  };

  const handleSuspendAccount = async () => {
    if (!window.confirm(t('admin.areYouSureYouWantToSuspendThisAccount'))) {
      return;
    }

    try {
      setSuspending(true);
      const response = await api.post(`/api/admin/users/${id}/suspend`);
      if (response.data) {
        showSuccess(t('admin.accountSuspendedSuccessfully'));
        // Update the user state directly
        setUser(prev => ({
          ...prev,
          status: 'suspended',
          accountStatus: 'suspended'
        }));
      }
    } catch (error) {
      console.error('Error suspending account:', error);
      if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else {
        showError(error.response?.data?.error || t('admin.failedToSuspendAccount'));
      }
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspendAccount = async () => {
    if (!window.confirm(t('admin.areYouSureYouWantToUnsuspendThisAccount'))) {
      return;
    }

    try {
      setSuspending(true);
      const response = await api.post(`/api/admin/users/${id}/unsuspend`);
      if (response.data) {
        showSuccess(t('admin.accountUnsuspendedSuccessfully'));
        // Update the user state directly
        setUser(prev => ({
          ...prev,
          status: 'active',
          accountStatus: 'active'
        }));
      }
    } catch (error) {
      console.error('Error unsuspending account:', error);
      if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else {
        showError(error.response?.data?.error || t('admin.failedToUnsuspendAccount'));
      }
    } finally {
      setSuspending(false);
    }
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const applyFilters = () => {
    // Filter transactions based on the selected options
    const filteredTransactions = user.transactions.filter(tx => {
      if (filterOptions.type !== 'all' && tx.type !== filterOptions.type) return false;
      if (filterOptions.status !== 'all' && tx.status !== filterOptions.status) return false;
      if (filterOptions.minAmount && tx.amount < parseFloat(filterOptions.minAmount)) return false;
      if (filterOptions.maxAmount && tx.amount > parseFloat(filterOptions.maxAmount)) return false;
      if (filterOptions.startDate && new Date(tx.date) < new Date(filterOptions.startDate)) return false;
      if (filterOptions.endDate && new Date(tx.date) > new Date(filterOptions.endDate)) return false;
      return true;
    });

    setUser(prev => ({
      ...prev,
      transactions: filteredTransactions
    }));
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setFilterOptions({
      type: 'all',
      status: 'all',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    });
    fetchUserDetails(); // Reset to original data
    setShowFilterModal(false);
  };

  const handleGenerateBankAccount = async () => {
    try {
      setGeneratingBankAccount(true);
      const response = await api.post(`/api/admin/users/${id}/generate-rib`);
      if (response.data) {
        showSuccess(t('admin.bankAccountGeneratedSuccessfully'));
        // Update the user state with the new data from the response
        setUser(prev => ({
          ...prev,
          associatedBankAccount: response.data.bankAccount._id,
          bankAccount: {
            bankName: response.data.bankAccount.bankName,
            accountNumber: response.data.bankAccount.accountNumber
          }
        }));
      }
    } catch (error) {
      console.error('Error generating bank account:', error);
      if (error.response?.status === 400) {
        showError(error.response.data.error || t('admin.failedToGenerateBankAccount'));
      } else if (error.response?.status === 404) {
        showError(t('admin.userNotFound'));
      } else if (error.response?.status === 403) {
        showError(t('admin.youDoNotHavePermissionToGenerateBankAccounts'));
      } else {
        showError(t('admin.failedToGenerateBankAccountPleaseTryAgainLater'));
      }
    } finally {
      setGeneratingBankAccount(false);
    }
  };

  // Add handler for resetting user transaction limits
  const handleResetLimits = async () => {
    if (!window.confirm(t('admin.areYouSureYouWantToResetThisUsersTransactionLimitsUsageForTheCurrentDayWeekAndMonth'))) return;
    try {
      await api.post(`/api/settings/reset-user-limits/${id}`);
      showSuccess(t('admin.userTransactionLimitsUsageResetSuccessfully'));
    } catch (error) {
      showError(error.response?.data?.error || t('admin.failedToResetUserTransactionLimits'));
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.userNotFound')}</h2>
          <button
            onClick={() => navigate('/admin/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('admin.backToUsers')}
          </button>
        </div>
    );
  }

  const getStatusBadge = (accountStatus) => {
    const config = {
      active: {
        icon: CheckCircle,
        className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      },
      suspended: {
        icon: Ban,
        className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      },
      pending_deletion: {
        icon: Clock,
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      }
    };

    // Default to active if status is undefined
    const { icon: Icon, className } = config[accountStatus] || config.active;
    const displayStatus = accountStatus || 'active';
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <Icon className="w-4 h-4" />
        {t('admin.status.' + displayStatus)}
      </span>
    );
  };

  const getKycStatusBadge = (status) => {
    const config = {
      verified: {
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      },
      pending: {
        icon: Clock,
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      },
      rejected: {
        icon: AlertTriangle,
        className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      },
      unverified: {
        icon: Shield,
        className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
      }
    };

    const { icon: Icon = Shield, className = 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200' } = config[status] || config.unverified;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <Icon className="w-4 h-4" />
        {t('admin.kycStatus.' + (status || 'unverified'))}
      </span>
    );
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'wallet_in':
        return <ArrowDownRight className="w-5 h-5 text-green-400" />;
      case 'wallet_out':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'bank_in':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'bank_out':
        return <Building2 className="w-5 h-5 text-orange-400" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className={`p-2 rounded-lg ${
                isDark
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-16 h-16 rounded-full ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            } flex items-center justify-center overflow-hidden`}>
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(user.accountStatus)}
                {getKycStatusBadge(user.kyc?.status)}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                  {isOnline
                    ? t('admin.online')
                    : lastSeen
                      ? t('admin.lastSeen', {
                          date: (() => {
                            const d = new Date(lastSeen);
                            if (i18n.language === 'ar') {
                              const time = d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                              const date = d.toLocaleDateString('ar-TN');
                              return `${time}، ${date}`;
                            } else {
                              return d.toLocaleString(i18n.language);
                            }
                          })()
                        })
                      : t('admin.offline')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateWallet}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                isDark
                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-lg shadow-blue-500/10'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-md'
              } flex items-center gap-2`}
            >
              <Wallet className="w-4 h-4" />
              {t('admin.createWallet')}
            </button>
            {!user.bankAccount && (
              <button
                onClick={handleGenerateBankAccount}
                disabled={generatingBankAccount}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 shadow-lg shadow-purple-500/10'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-md'
                } flex items-center gap-2`}
              >
                <CreditCard className="w-4 h-4" />
                {generatingBankAccount ? t('admin.generating') : t('admin.generateBankAccount')}
              </button>
            )}
            {user.kyc?.status === 'rejected' && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 shadow-lg shadow-green-500/10'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-md'
                } flex items-center gap-2`}
              >
                <CheckCircle className="w-4 h-4" />
                {verifying ? t('admin.verifying') : t('admin.verifyUser')}
              </button>
            )}
            {user.kyc?.status === 'verified' && (
              <button
                onClick={handleReject}
                disabled={rejecting}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 shadow-lg shadow-red-500/10'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 shadow-md'
                } flex items-center gap-2`}
              >
                <XCircle className="w-4 h-4" />
                {rejecting ? t('admin.rejecting') : t('admin.rejectUser')}
              </button>
            )}

            {user.accountStatus === 'suspended' ? (
              <button 
                onClick={handleUnsuspendAccount}
                disabled={suspending}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 shadow-lg shadow-green-500/10'
                    : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-md'
                } flex items-center gap-2`}
              >
                <CheckCircle className="w-4 h-4" />
                {suspending ? t('admin.unsuspending') : t('admin.unsuspendAccount')}
              </button>
            ) : (
              <button 
                onClick={handleSuspendAccount}
                disabled={suspending}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 shadow-lg shadow-pink-500/10'
                    : 'bg-pink-50 text-pink-600 hover:bg-pink-100 shadow-md'
                } flex items-center gap-2`}
              >
                <Ban className="w-4 h-4" />
                {suspending ? t('admin.suspending') : t('admin.suspendAccount')}
              </button>
            )}
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium">{t('admin.contact')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              <p className="text-gray-500 dark:text-gray-400">{user.phone}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-orange-400" />
              <h3 className="font-medium">{t('admin.address')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                {user.kyc?.personalInfo?.address || t('admin.notProvided')}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {user.kyc?.personalInfo?.city || ''} {user.kyc?.personalInfo?.province || ''} {user.kyc?.personalInfo?.zipCode || ''}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">{t('admin.kycInformation')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                {t('admin.idType')}: {user.kyc?.personalInfo?.idType ? t('admin.idTypeOptions.' + user.kyc?.personalInfo?.idType) : t('admin.notSubmitted')}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {t('admin.idNumber')}: {user.kyc?.personalInfo?.idNumber || t('admin.notSubmitted')}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium">{t('admin.accountInfo')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                {t('admin.joined')}: {new Date(user.joinedAt).toLocaleDateString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {t('admin.lastLogin')}: {new Date(user.lastLogin).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h2 className="text-xl font-semibold">{t('admin.transactionHistory')}</h2>
              <div className="flex-1" />
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleFilter}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                    isDark
                      ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 shadow-lg shadow-purple-500/10'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-md'
                  } flex items-center gap-2`}
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? t('admin.hideFilters') : t('admin.showFilters')}
                </button>
                <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-lg shadow-blue-500/10'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-md'
                } flex items-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  {t('admin.export')}
                </button>
              </div>
            </div>

            {/* Inline Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.transactionType')}</label>
                    <select
                      value={filterOptions.type}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                          : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                      } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                    >
                      <option value="all">{t('admin.allTypes')}</option>
                      <option value="wallet_in">{t('admin.walletIn')}</option>
                      <option value="wallet_out">{t('admin.walletOut')}</option>
                      <option value="bank_in">{t('admin.bankIn')}</option>
                      <option value="bank_out">{t('admin.bankOut')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.status')}</label>
                    <select
                      value={filterOptions.status}
                      onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                          : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                      } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                    >
                      <option value="all">{t('admin.allStatus')}</option>
                      <option value="completed">{t('admin.completed')}</option>
                      <option value="pending">{t('admin.pending')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.minAmount')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={filterOptions.minAmount}
                        onChange={(e) => setFilterOptions(prev => ({ ...prev, minAmount: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                            : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.maxAmount')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={filterOptions.maxAmount}
                        onChange={(e) => setFilterOptions(prev => ({ ...prev, maxAmount: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                            : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                        placeholder="∞"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.startDate')}</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filterOptions.startDate}
                        min={user.joinedAt ? new Date(user.joinedAt).toISOString().split('T')[0] : undefined}
                        onChange={(e) => setFilterOptions(prev => ({ ...prev, startDate: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                            : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('admin.endDate')}</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={filterOptions.endDate}
                        min={user.joinedAt ? new Date(user.joinedAt).toISOString().split('T')[0] : undefined}
                        onChange={(e) => setFilterOptions(prev => ({ ...prev, endDate: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                            : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                        } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={resetFilters}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                      isDark
                        ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 shadow-lg shadow-gray-500/10'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 shadow-md'
                    } flex items-center gap-2`}
                  >
                    {t('admin.reset')}
                  </button>
                  <button
                    onClick={applyFilters}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                      isDark
                        ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-lg shadow-blue-500/10'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-md'
                    } flex items-center gap-2`}
                  >
                    {t('admin.applyFilters')}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.type')}</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.amount')}</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.description')}</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.date')}</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.statusHeader')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {user.transactions?.length > 0 ? (
                  user.transactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group hover:${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="capitalize">{t('admin.transactionType.' + tx.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          tx.type.includes('in') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {tx.type.includes('in') ? '+' : '-'}{tx.amount} {tx.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">{tx.description}</td>
                      <td className="px-6 py-4">{new Date(tx.date).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {t('admin.status.' + tx.status)}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('admin.noTransactionsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        {userProfile?.role === 'superadmin' && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg mt-4 hover:bg-red-700 transition-colors"
            onClick={handleResetLimits}
          >
            {t('admin.resetTransactionLimitsUsage')}
          </button>
        )}
      </div>

  );
};

export default UserProfile;
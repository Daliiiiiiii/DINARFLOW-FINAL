import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
  Calendar,
  ChevronDown,
  Clock,
  SortDesc,
  CheckSquare,
  Shield
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../lib/axios';
import ActionLoader from '../assets/animations/ActionLoader';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

const KYC = () => {
  const { theme } = useTheme();
  const { showError, showSuccess } = useNotification();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0
  });
  const [debouncedFilters, setDebouncedFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all',
    sortBy: 'newest'
  });
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(null);
  const { t, i18n } = useTranslation();

  // Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters({
        status: statusFilter,
        search: searchTerm,
        dateRange: filters.dateRange,
        sortBy: filters.sortBy
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchTerm, filters]);

  // Fetch KYC requests
  const fetchRequests = async () => {
    try {
      setIsFiltering(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: debouncedFilters.sortBy
      };

      // Only add filters if they're not set to 'all'
      if (debouncedFilters.status !== 'all') {
        params.status = debouncedFilters.status;
      }
      if (debouncedFilters.dateRange !== 'all') {
        params.dateRange = debouncedFilters.dateRange;
      }
      if (debouncedFilters.search) {
        params.search = debouncedFilters.search;
      }

      const { data } = await api.get('/api/admin/kyc-requests', { params });
      setRequests(data.requests);
      setPagination(data.pagination);
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error('Error fetching KYC requests:', error);
      showError('Failed to fetch KYC requests');
    } finally {
      setIsFiltering(false);
      setLoading(false);
    }
  };

  // Fetch when debounced filters change
  useEffect(() => {
    fetchRequests();
  }, [debouncedFilters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      sortBy: 'newest'
    });
    setStatusFilter('all');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApprove = async (userId) => {
    try {
      setIsFiltering(true);
      await api.post(`/api/admin/kyc/${userId}/approve`);
      showSuccess('KYC request approved successfully');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving KYC request:', error);
      showError(error.response?.data?.error || 'Failed to approve KYC request');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleReject = async (userId) => {
    try {
      setIsFiltering(true);
      await api.post(`/api/admin/kyc/${userId}/reject`);
      showSuccess('KYC request rejected successfully');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting KYC request:', error);
      showError(error.response?.data?.error || 'Failed to reject KYC request');
    } finally {
      setIsFiltering(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusIcon = (status) => {
    const config = {
      pending: { icon: AlertTriangle, className: 'text-yellow-400' },
      approved: { icon: CheckCircle, className: 'text-green-400' },
      rejected: { icon: XCircle, className: 'text-red-400' },
      verified: { icon: CheckCircle, className: 'text-green-400' },
      unverified: { icon: AlertTriangle, className: 'text-gray-400' }
    };

    const statusConfig = config[status] || config.unverified;
    const IconComponent = statusConfig.icon;
    return <IconComponent className={`w-5 h-5 ${statusConfig.className}`} />;
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        icon: AlertTriangle,
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      },
      approved: {
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      },
      rejected: {
        icon: XCircle,
        className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      },
      verified: {
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      },
      unverified: {
        icon: Shield,
        className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
      }
    };

    const { icon: Icon, className } = config[status] || config.unverified;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <Icon className="w-4 h-4" />
        {t('admin.kycStatus.' + (status || 'unverified'))}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.kycVerification')}</h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            } ${statusFilter === 'pending' ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <span className="text-yellow-400 font-medium">
              {statusCounts.pending}
            </span> {t('admin.kycStatus.pending')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            } ${statusFilter === 'verified' ? 'ring-2 ring-green-400' : ''}`}
          >
            <span className="text-green-400 font-medium">
              {statusCounts.verified}
            </span> {t('admin.kycStatus.verified')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            } ${statusFilter === 'rejected' ? 'ring-2 ring-red-400' : ''}`}
          >
            <span className="text-red-400 font-medium">
              {statusCounts.rejected}
            </span> {t('admin.kycStatus.rejected')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            } ${statusFilter === 'all' ? 'ring-2 ring-blue-400' : ''}`}
          >
            <span className="text-blue-400 font-medium">
              {statusCounts.total}
            </span> {t('admin.all')}
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl shadow-lg overflow-hidden relative`}
      >
        {isFiltering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <ActionLoader isLoading={true} />
            </div>
          </div>
        )}

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('admin.searchKycPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${i18n.language === 'ar' ? 'pr-8 pl-4' : 'pl-8 pr-4'} py-2.5 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                    : 'border-gray-300 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${i18n.language === 'ar' ? 'right-2.5' : 'left-2.5'}`} />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                >
                  <option value="all">{t('admin.allStatus')}</option>
                  <option value="pending">{t('admin.kycStatus.pending')}</option>
                  <option value="verified">{t('admin.kycStatus.verified')}</option>
                  <option value="approved">{t('admin.kycStatus.approved')}</option>
                  <option value="rejected">{t('admin.kycStatus.rejected')}</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CheckSquare className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-[200px] relative">
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                >
                  <option value="all">{t('admin.dateRange.all')}</option>
                  <option value="today">{t('admin.dateRange.today')}</option>
                  <option value="week">{t('admin.dateRange.week')}</option>
                  <option value="month">{t('admin.dateRange.month')}</option>
                  <option value="year">{t('admin.dateRange.year')}</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-[200px] relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                >
                  <option value="newest">{t('admin.sort.newest')}</option>
                  <option value="oldest">{t('admin.sort.oldest')}</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SortDesc className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFilters}
                className={`px-4 py-2.5 rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-all duration-200 flex items-center gap-2 font-medium`}
              >
                <XCircle className="w-4 h-4" />
                {t('admin.clearFilters')}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-sm ${i18n.language === 'ar' ? 'text-right' : 'text-left'} ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.user')}</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.idNumber')}</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.submitted')}</th>
                <th style={{ width: '80px' }} className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-center">{t('admin.attempt')}</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.statusLabel')}</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((request) => (
                <motion.tr 
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`group hover:${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                  } transition-colors`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${
                        isDark ? 'bg-gray-800' : 'bg-gray-200'
                      } flex items-center justify-center overflow-hidden`}>
                        {request.profilePicture ? (
                          <img 
                            src={request.profilePicture} 
                            alt={request.user}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{request.user || t('admin.noNameProvided')}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{request.idNumber || t('admin.notProvided')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{request.idType ? t('admin.idTypeOptions.' + request.idType) : t('admin.notProvided')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {request.submittedAt ? new Date(request.submittedAt).toLocaleString() : t('admin.notSubmittedYet')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center" style={{ width: '80px' }}>{request.attempt}</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(request.status || 'unverified')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                          isDark
                            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-lg shadow-blue-500/10'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-md'
                        } flex items-center gap-1`}
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin.view')}
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(request.id)}
                            className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                              isDark
                                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 shadow-lg shadow-green-500/10'
                                : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-md'
                            }`}
                          >
                            {t('admin.approve')}
                          </button>
                          <button 
                            onClick={() => handleReject(request.id)}
                            className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                              isDark
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 shadow-lg shadow-red-500/10'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 shadow-md'
                            }`}
                          >
                            {t('admin.reject')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('admin.showingEntries', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
              })}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
                } transition-colors`}
              >
                {t('admin.previous')}
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
                } transition-colors`}
              >
                {t('admin.next')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KYC Details Modal */}
      {selectedRequest && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className={`${
            isDark 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('admin.kycVerificationDetails')}</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-400"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('admin.userInformation')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.name')}</label>
                      <div className="font-medium">{selectedRequest.user}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.email')}</label>
                      <div className="font-medium">{selectedRequest.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.phone')}</label>
                      <div className="font-medium">{selectedRequest.phone || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.submitted')}</label>
                      <div className="font-medium">{selectedRequest.submittedAt ? new Date(selectedRequest.submittedAt).toLocaleString() : 'Not submitted yet'}</div>
                    </div>
                  </div>
                </div>

                {/* ID Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('admin.idInformation')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.idType')}</label>
                      <div className="font-medium">{selectedRequest.idType || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.idNumber')}</label>
                      <div className="font-medium">{selectedRequest.idNumber || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                {/* Attempt Selector */}
                {Array.isArray(selectedRequest.allAttempts) && selectedRequest.allAttempts.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('admin.selectAttempt')}</label>
                    <select
                      value={selectedAttemptIndex ?? selectedRequest.allAttempts.length - 1}
                      onChange={e => setSelectedAttemptIndex(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${isDark ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70' : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'} focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                    >
                      {selectedRequest.allAttempts.map((att, idx) => (
                        <option key={idx} value={idx}>{t('admin.attempt')} {idx + 1} {idx === selectedRequest.allAttempts.length - 1 ? `(${t('admin.current')})` : ''}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Documents Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('admin.documents')}</h3>
                  {(() => {
                    const attempts = selectedRequest.allAttempts || [];
                    const idx = selectedAttemptIndex ?? attempts.length - 1;
                    const attempt = attempts[idx] || {};
                    const docs = attempt.documents || {};
                    // Debug: Log all document URLs
                    console.log('KYC Document URLs:', {
                      frontId: docs.frontId,
                      backId: docs.backId,
                      selfieWithId: docs.selfieWithId,
                      signature: docs.signature
                    });
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">{t('admin.frontId')}</label>
                          <div className={`aspect-[3/2] ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex flex-col items-center justify-center relative`}>
                            {docs.frontId ? (
                              <>
                                <a href={docs.frontId} target="_blank" rel="noopener noreferrer">
                                  <img src={docs.frontId} alt="Front ID" className="max-h-32 object-contain rounded" />
                                </a>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => window.open(docs.frontId, '_blank')}
                                    className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                                  >
                                    {t('admin.zoom')}
                                  </button>
                                  <a
                                    href={docs.frontId}
                                    download
                                    className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition"
                                  >
                                    {t('admin.download')}
                                  </a>
                                </div>
                              </>
                            ) : (
                              <FileText className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">{t('admin.backId')}</label>
                          <div className={`aspect-[3/2] ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex flex-col items-center justify-center relative`}>
                            {docs.backId ? (
                              <>
                                <a href={docs.backId} target="_blank" rel="noopener noreferrer">
                                  <img src={docs.backId} alt="Back ID" className="max-h-32 object-contain rounded" />
                                </a>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => window.open(docs.backId, '_blank')}
                                    className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                                  >
                                    {t('admin.zoom')}
                                  </button>
                                  <a
                                    href={docs.backId}
                                    download
                                    className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition"
                                  >
                                    {t('admin.download')}
                                  </a>
                                </div>
                              </>
                            ) : (
                              <FileText className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">{t('admin.selfieWithId')}</label>
                          <div className={`aspect-[3/2] ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex flex-col items-center justify-center relative`}>
                            {docs.selfieWithId ? (
                              <>
                                <a href={docs.selfieWithId} target="_blank" rel="noopener noreferrer">
                                  <img src={docs.selfieWithId} alt="Selfie with ID" className="max-h-32 object-contain rounded" />
                                </a>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => window.open(docs.selfieWithId, '_blank')}
                                    className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                                  >
                                    {t('admin.zoom')}
                                  </button>
                                  <a
                                    href={docs.selfieWithId}
                                    download
                                    className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition"
                                  >
                                    {t('admin.download')}
                                  </a>
                                </div>
                              </>
                            ) : (
                              <User className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">{t('admin.signature')}</label>
                          <div className={`aspect-[3/2] ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg flex flex-col items-center justify-center relative`}>
                            {docs.signature ? (
                              <>
                                <a href={docs.signature} target="_blank" rel="noopener noreferrer">
                                  <img src={docs.signature} alt="Signature" className="max-h-32 object-contain rounded" />
                                </a>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => window.open(docs.signature, '_blank')}
                                    className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                                  >
                                    {t('admin.zoom')}
                                  </button>
                                  <a
                                    href={docs.signature}
                                    download
                                    className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition"
                                  >
                                    {t('admin.download')}
                                  </a>
                                </div>
                              </>
                            ) : (
                              <FileText className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('admin.statusLabel')}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedRequest.status || 'unverified')}
                    {selectedRequest.status === 'rejected' && (
                      <span className="text-sm text-red-400">{selectedRequest.rejectionReason}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex items-center gap-3 pt-4">
                    <button 
                      onClick={() => handleApprove(selectedRequest.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        isDark
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 shadow-lg shadow-green-500/10'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-md'
                      }`}
                    >
                      {t('admin.approve')}
                    </button>
                    <button 
                      onClick={() => handleReject(selectedRequest.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        isDark
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 shadow-lg shadow-red-500/10'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 shadow-md'
                      }`}
                    >
                      {t('admin.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KYC;
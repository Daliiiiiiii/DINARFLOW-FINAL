import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical,
  Ban,
  UserCheck,
  Edit,
  Trash2,
  FileText,
  Eye,
  X,
  EyeOff,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  CheckSquare,
  SortDesc,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import ActionLoader from '../assets/animations/ActionLoader';
import api from '../lib/axios';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

const AddUserForm = ({ isDark, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    if (/^[a-zA-Z\s-]*$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,8}$/.test(value)) {
      setFormData(prev => ({ ...prev, phoneNumber: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await api.post('/api/admin/users', {
        ...formData,
        phoneNumber: `+216${formData.phoneNumber}`,
        role: 'user'
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          isDark ? 'bg-gray-900' : 'bg-white'
        } rounded-xl shadow-xl w-full max-w-md p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add New User</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            } transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleNameChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleNameChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                +216
              </div>
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                maxLength={8}
                className={`w-full pl-12 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Enter 8 digits after +216</p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

const Users = () => {
  const { theme } = useTheme();
  const { showError, showSuccess } = useNotification();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    kycStatus: 'all',
    dateRange: 'all',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const navigate = useNavigate();
  const [isFiltering, setIsFiltering] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState({
    accountStatus: 'all',
    search: '',
    kycStatus: 'all',
    dateRange: 'all',
    sortBy: 'newest'
  });
  const { t } = useTranslation();

  // Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters({
        accountStatus: accountStatusFilter,
        search: searchTerm,
        kycStatus: filters.kycStatus,
        dateRange: filters.dateRange,
        sortBy: filters.sortBy
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [accountStatusFilter, searchTerm, filters]);

  // Fetch users when debounced filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFiltering(true);
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sortBy: debouncedFilters.sortBy
        };

        // Only add filters if they're not set to 'all'
        if (debouncedFilters.accountStatus !== 'all') {
          params.accountStatus = debouncedFilters.accountStatus;
        }
        if (debouncedFilters.kycStatus !== 'all') {
          params.kycStatus = debouncedFilters.kycStatus;
        }
        if (debouncedFilters.dateRange !== 'all') {
          params.dateRange = debouncedFilters.dateRange;
        }
        if (debouncedFilters.search) {
          params.search = debouncedFilters.search;
        }

        const { data } = await api.get('/api/admin/users', { params });
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching users:', error);
        showError('Failed to fetch users');
      } finally {
        setIsFiltering(false);
      }
    };

    fetchData();
  }, [debouncedFilters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setFilters({
      kycStatus: 'all',
      dateRange: 'all',
      sortBy: 'newest'
    });
    setAccountStatusFilter('all');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const endpoint = newStatus === 'suspended' ? 'suspend' : 'unsuspend';
      const response = await api.post(`/api/admin/users/${userId}/${endpoint}`);
      if (response.data) {
        showSuccess(`Account ${newStatus === 'suspended' ? 'suspended' : 'unsuspended'} successfully`);
        // Update the users list with the status from the response
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, accountStatus: response.data.status }
            : user
        ));

        // If we're filtering by status, refresh the list to ensure proper filtering
        if (accountStatusFilter !== 'all') {
          const params = {
            page: pagination.page,
            limit: pagination.limit,
            sortBy: debouncedFilters.sortBy
          };

          if (accountStatusFilter !== 'all') {
            params.accountStatus = accountStatusFilter;
          }
          if (debouncedFilters.kycStatus !== 'all') {
            params.kycStatus = debouncedFilters.kycStatus;
          }
          if (debouncedFilters.dateRange !== 'all') {
            params.dateRange = debouncedFilters.dateRange;
          }
          if (debouncedFilters.search) {
            params.search = debouncedFilters.search;
          }

          const { data } = await api.get('/api/admin/users', { params });
          setUsers(data.users);
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error changing account status:', error);
      showError(error.response?.data?.error || `Failed to ${newStatus === 'suspended' ? 'suspend' : 'unsuspend'} account`);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const getStatusBadge = (accountStatus) => {
    const config = {
      active: {
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
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
        {displayStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const getKycStatusIcon = (status) => {
    const config = {
      verified: { icon: CheckCircle, className: 'text-green-400' },
      pending: { icon: Clock, className: 'text-yellow-400' },
      rejected: { icon: XCircle, className: 'text-red-400' },
      unverified: { icon: Shield, className: 'text-gray-400' }
    };

    const IconComponent = config[status]?.icon || Shield;
    return <IconComponent className={`w-5 h-5 ${config[status]?.className || 'text-gray-400'}`} />;
  };

  const getKycStatusBadge = (status) => {
    const config = {
      verified: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
      rejected: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      unverified: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status] || config.unverified}`}>
        {getKycStatusIcon(status)}
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unverified'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.usersTitle')}</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isDark 
            ? 'bg-gray-900/50 border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl shadow-lg overflow-hidden relative`}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <ActionLoader isLoading={isFiltering} />
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, phone, or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                    : 'border-gray-300 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <select
                  value={accountStatusFilter}
                  onChange={(e) => setAccountStatusFilter(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                >
                  <option value="all">All Account Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Shield className="w-4 h-4 text-gray-400" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 min-w-[200px] relative">
                <select
                  value={filters.kycStatus}
                  onChange={(e) => handleFilterChange('kycStatus', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                >
                  <option value="all">All KYC Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="unverified">Unverified</option>
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
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
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
                Clear Filters
              </motion.button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-left text-sm ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Contact</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">ID Number</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">KYC</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      {t('admin.noUsersFound')}
                    </motion.div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    className={`group hover:${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    } transition-all duration-200`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${
                          isDark ? 'bg-gray-800' : 'bg-gray-200'
                        } flex items-center justify-center overflow-hidden`}>
                          {user.profilePicture ? (
                            <img 
                              src={user.profilePicture} 
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {user.kyc?.personalInfo?.idNumber || 'Not submitted'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(user.accountStatus)}
                        {user.accountStatus === 'suspended' ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className={`p-1 rounded-lg ${
                              isDark
                                ? 'hover:bg-green-900/20 text-green-400'
                                : 'hover:bg-green-50 text-green-600'
                            } transition-colors`}
                            title="Unsuspend Account"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            className={`p-1 rounded-lg ${
                              isDark
                                ? 'hover:bg-red-900/20 text-red-400'
                                : 'hover:bg-red-50 text-red-600'
                            } transition-colors`}
                            title="Suspend Account"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getKycStatusBadge(user.kycStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewProfile(user.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              } transition-colors`}
            >
                Previous
              </button>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
              } transition-colors`}
            >
                Next
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {showAddModal && ReactDOM.createPortal(
        <AddUserForm
          isDark={isDark}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            showSuccess('User created successfully');
            fetchUsers();
          }}
        />,
        document.body
      )}

      {showFilterModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${
              isDark ? 'bg-gray-900' : 'bg-white'
            } rounded-xl shadow-xl w-full max-w-md p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filter Users</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className={`p-2 rounded-lg ${
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                } transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">KYC Status</label>
                <select
                  value={filters.kycStatus}
                  onChange={(e) => handleFilterChange('kycStatus', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="all">All KYC Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="newest">Newest Accounts</option>
                  <option value="oldest">Oldest Accounts</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleResetFilters}
                className={`px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Users;
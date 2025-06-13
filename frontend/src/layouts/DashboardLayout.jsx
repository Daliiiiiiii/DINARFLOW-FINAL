import React, { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import {
  Wallet,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Sun,
  Moon,
  LayoutDashboard,
  ArrowLeftRight,
  Building2,
  Clock,
  UserCircle,
  MessagesSquare,
  Users,
  FileText,
  Shield,
  BarChart2,
  FileCheck,
  Users2,
  X,
  Check,
  ArrowUpRight,
  Bitcoin,
  AlertTriangle,
  Trash2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../assets/animations/LoadingSpinner';
import NotificationList from '../components/notifications/NotificationList';
import { getImageUrl } from '../utils/urlUtils'
import Logo from '../components/ui/Logo';
import { useNotification } from '../contexts/NotificationContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const { loading, userProfile, logout, visualRole, toggleVisualRole, updateWalletBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const isVisualAdmin = visualRole === 'admin';
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add effect to handle route changes based on visual role
  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        navigate('/login');
      } else if (isVisualAdmin && !location.pathname.startsWith('/admin')) {
        navigate('/admin');
      } else if (location.pathname.startsWith('/admin') && !isVisualAdmin) {
        navigate('/dashboard');
      }
    }
  }, [userProfile, loading, isVisualAdmin, location.pathname, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (loading) {
      console.log('[DEBUG] Auth still loading, waiting to initialize WebSocket');
      return;
    }

    if (!userProfile) {
      console.log('[DEBUG] No user profile available, redirecting to login');
      navigate('/login');
      return;
    }

    if (!userProfile._id) {
      console.error('[DEBUG] User profile missing _id');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('[DEBUG] No authentication token found');
      navigate('/login');
      return;
    }

    console.log('[DEBUG] Initializing WebSocket connection for user:', userProfile._id);
    
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true,
      autoConnect: true,
      path: '/socket.io',
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('[DEBUG] WebSocket connected for user:', userProfile.email);
      // Join user's room
      const userRoom = `user:${userProfile._id}`;
      console.log('[DEBUG] Joining user room:', userRoom);
      newSocket.emit('join:room', userRoom);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[DEBUG] WebSocket connection error:', error);
      if (error.message === 'Authentication error') {
        // Token might be invalid, try to refresh or redirect to login
        console.log('[DEBUG] Authentication failed, redirecting to login');
        navigate('/login');
      } else {
        // For other errors, try to reconnect
        console.log('[DEBUG] Connection error, attempting to reconnect...');
        setTimeout(() => {
          newSocket.connect();
        }, 2000);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[DEBUG] WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[DEBUG] WebSocket reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[DEBUG] WebSocket reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[DEBUG] WebSocket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[DEBUG] WebSocket reconnection failed');
    });

    // Add global balance update listener
    newSocket.on('balance:updated', (data) => {
      console.log('[DEBUG] Received global balance update:', data);
      if (data.userId === userProfile._id && data.walletBalance !== undefined) {
        console.log('[DEBUG] Updating global wallet balance:', data.walletBalance);
        // Force a re-render by updating the state
        updateWalletBalance(data.walletBalance);
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated', { 
          detail: { balance: data.walletBalance }
        }));
      }
    });

    // Add global notification listener
    newSocket.on('notification:received', (data) => {
      console.log('[DEBUG] Received notification:', data);
      const { notification } = data;
      
      // Update notifications state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play appropriate sound based on notification type
      let soundFile = '/sounds/notification.mp3'; // default sound for messages
      
      if (notification.type === 'transaction') {
        if (notification.data?.type === 'funds_released') {
          soundFile = '/sounds/success.mp3';
        } else if (notification.data?.type === 'order_cancelled') {
          soundFile = '/sounds/warning.mp3';
        } else if (notification.data?.type === 'payment_verified') {
          soundFile = '/sounds/notification.mp3';
        }
      }
      
      const notificationSound = new Audio(soundFile);
      notificationSound.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
      
      // Show toast for new notification
      toast.success(notification.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // Store socket instance globally
    window.socket = newSocket;
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log('[DEBUG] Cleaning up WebSocket connection');
        newSocket.disconnect();
        window.socket = null;
      }
    };
  }, [userProfile, loading, navigate, updateWalletBalance, setNotifications, setUnreadCount]);

  // Handle route changes
  React.useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setIsPageLoading(false);
      }, 100);
    };

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  const navItems = isVisualAdmin ? [] : [
    { path: '/dashboard', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/wallet', icon: Wallet, label: t('navigation.wallet') },
    { path: '/crypto-wallet', icon: Bitcoin, label: t('navigation.cryptoWallet') },
    { path: '/transfer', icon: ArrowLeftRight, label: t('navigation.transfer') },
    { path: '/bank-transfer', icon: Building2, label: t('navigation.bankTransfer') },
    { path: '/p2p', icon: Users2, label: t('navigation.p2p') },
    { path: '/history', icon: Clock, label: t('navigation.history') },
    { path: '/profile', icon: UserCircle, label: t('navigation.profile') },
    { path: '/settings', icon: Settings, label: t('navigation.settings') },
    ...(['admin', 'superadmin'].includes(userProfile?.role) ? [] : [{ path: '/support', icon: MessagesSquare, label: t('navigation.support') }])
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSwitchToUserView = () => {
    toggleVisualRole();
    navigate('/dashboard', { state: { fromReload: false } });
  };

  const handleSwitchToAdminView = () => {
    toggleVisualRole();
    navigate('/admin', { state: { fromReload: false } });
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div dir="ltr" style={{ direction: 'ltr' }} className={`dashboard-root min-h-screen h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col lg:flex-row overflow-hidden`}>
      {/* Loading Spinner */}
      <AnimatePresence mode="wait">
        {isPageLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm"
          >
            <LoadingSpinner />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        dir="ltr"
        className={`w-64 ${isMobileMenuOpen ? 'fixed' : 'relative'} lg:relative ${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-xl' 
            : 'bg-white'
        } p-6 flex flex-col h-screen overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Link to="/" className="flex items-center gap-2 mb-10">
          <Logo />
        </Link>

        {/* Admin Navigation - Moved to top */}
        {['admin', 'superadmin'].includes(userProfile?.role) && (
          <div className="mb-8">
            <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
              {t('navigation.admin')}
            </h3>
            <nav className="mt-2 space-y-2">
              {isVisualAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === '/admin'
                        ? 'bg-blue-600/20 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {t('navigation.adminDashboard')}
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === '/admin/users'
                        ? 'bg-blue-600/20 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    {t('navigation.adminUsers')}
                  </Link>
                  <Link
                    to="/admin/kyc"
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === '/admin/kyc'
                        ? 'bg-blue-600/20 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <FileCheck className="w-5 h-5" />
                    {t('navigation.adminKYC')}
                  </Link>
                  <Link
                    to="/admin/support"
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === '/admin/support'
                        ? 'bg-blue-600/20 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <MessagesSquare className="w-5 h-5" />
                    {t('navigation.adminSupport')}
                  </Link>
                  {userProfile?.role === 'superadmin' && (
                    <Link
                      to="/admin/settings"
                      className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                        location.pathname === '/admin/settings'
                          ? 'bg-blue-600/20 text-blue-600'
                          : isDark 
                            ? 'hover:bg-gray-800 text-gray-300' 
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      {t('navigation.adminSettings')}
                    </Link>
                  )}
                </>
              ) : (
                <button
                  onClick={handleSwitchToAdminView}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 text-purple-400 border border-purple-500/20' 
                      : 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-purple-100 text-purple-600 border border-purple-200'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">{t('navigation.switchToAdmin')}</span>
                </button>
              )}
            </nav>
          </div>
        )}

        <nav className="flex-1">
          {isVisualAdmin ? (
            <div className="mb-4">
              <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                {t('navigation.userView')}
              </h3>
              <button
                onClick={handleSwitchToUserView}
                className={`w-full mt-2 px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-400 border border-blue-500/20' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-600 border-blue-200'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">{t('navigation.switchToUser')}</span>
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                {t('navigation.userView')}
              </h3>
            </div>
          )}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsPageLoading(true)}
                    className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-600/20 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-800 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <button 
            onClick={toggleTheme}
            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } transition-colors`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? t('common.lightMode') : t('common.darkMode')}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            {t('common.logout')}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:w-[calc(100%-16rem)] h-screen overflow-y-auto" dir="ltr">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`sticky top-0 z-40 ${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-xl' 
              : 'bg-white/50 backdrop-blur-xl'
          } px-4 lg:px-8 py-4`}
        >
          <div className="flex justify-between items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-xl mx-4">
              <div className="relative search-bar" dir="ltr">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 -mt-0.5 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  className={`w-full pl-11 pr-4 py-2 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-800 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors relative group`}
                >
                  <Bell className="w-6 h-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] lg:w-96 ${
                        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                      } border rounded-xl shadow-xl overflow-hidden z-50`}
                    >
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="font-medium">{t('notifications.title')}</h3>
                        <div className="flex items-center gap-2">
                          <Link
                            to="/notifications"
                            className="p-1 text-gray-400 hover:text-gray-300"
                            title={t('notifications.actions.viewAll')}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="p-1 text-gray-400 hover:text-gray-300"
                            title={t('notifications.actions.markAllRead')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleDeleteAllNotifications}
                            className="p-1 text-gray-400 hover:text-gray-300"
                            title={t('notifications.actions.deleteAll')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 text-gray-400 hover:text-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                        {isLoading ? (
                          <div className="p-4 text-center text-gray-400">{t('common.loading')}</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">{t('notifications.empty.title')}</div>
                        ) : (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`p-4 flex items-start gap-3 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                notification.type === 'transaction'
                                  ? 'bg-green-500/10 text-green-400'
                                  : notification.type === 'alert'
                                    ? 'bg-yellow-500/10 text-yellow-400'
                                    : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {notification.type === 'transaction' ? (
                                  <Wallet className="w-4 h-4" />
                                ) : notification.type === 'alert' ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {t(notification.title, {
                                    amount: notification.data?.amount,
                                    currency: notification.data?.currency,
                                    recipient: notification.data?.recipientName ? ` to ${notification.data.recipientName}` : '',
                                    sender: notification.data?.senderName ? ` from ${notification.data.senderName}` : '',
                                    location: notification.data?.location,
                                    device: notification.data?.device,
                                    status: notification.data?.enabled ? t('common.enabled') : t('common.disabled'),
                                    type: notification.data?.type,
                                    date: notification.data?.date,
                                    message: notification.data?.message,
                                    featureName: notification.data?.featureName
                                  }) !== notification.title ? t(notification.title, {
                                    amount: notification.data?.amount,
                                    currency: notification.data?.currency,
                                    recipient: notification.data?.recipientName ? ` to ${notification.data.recipientName}` : '',
                                    sender: notification.data?.senderName ? ` from ${notification.data.senderName}` : '',
                                    location: notification.data?.location,
                                    device: notification.data?.device,
                                    status: notification.data?.enabled ? t('common.enabled') : t('common.disabled'),
                                    type: notification.data?.type,
                                    date: notification.data?.date,
                                    message: notification.data?.message,
                                    featureName: notification.data?.featureName
                                  }) : t('notifications.unknown')}
                                  {!notification.read && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full">{t('notifications.new')}</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 mt-0.5">
                                  {(() => {
                                    const msg = t(notification.message, {
                                      amount: notification.data?.amount,
                                      currency: notification.data?.currency,
                                      recipient: notification.data?.recipientName ? ` to ${notification.data.recipientName}` : '',
                                      sender: notification.data?.senderName ? ` from ${notification.data.senderName}` : '',
                                      location: notification.data?.location,
                                      device: notification.data?.device,
                                      status: notification.data?.enabled ? t('common.enabled') : t('common.disabled'),
                                      type: notification.data?.type,
                                      date: notification.data?.date,
                                      message: notification.data?.message,
                                      featureName: notification.data?.featureName
                                    });
                                    // If the result still contains {type}, remove or replace it with a user-friendly string
                                    return msg.replace(/\{type\}/g, notification.data?.type ? t(`notifications.types.${notification.data?.type}`) || '' : '');
                                  })()}
                                </p>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleString('en-US')}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  {!notification.read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification._id)}
                                      className="text-xs text-green-400 hover:underline"
                                    >
                                      {t('notifications.actions.markAsRead')}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notification._id)}
                                    className="text-xs text-red-400 hover:underline"
                                  >
                                    {t('notifications.actions.delete')}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Profile Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800' 
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  } border transition-colors`}
                >
                  {userProfile?.profilePicture ? (
                    <img
                      src={getImageUrl(userProfile.profilePicture)}
                      alt={userProfile.displayName || t('common.profile')}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Profile image failed to load:', userProfile.profilePicture);
                        e.target.src = ''; // Clear the src to prevent infinite error loop
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="hidden lg:inline text-sm font-medium">
                    {userProfile?.displayName || t('common.user')}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Profile Menu */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
                        isDark 
                          ? 'bg-gray-900 border-gray-800' 
                          : 'bg-white border-gray-200'
                      } border py-1`}
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('common.viewProfile')}
                      </Link>
                      {!['admin', 'superadmin'].includes(userProfile?.role) && (
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {t('common.settings')}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('common.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
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
  FileCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../assets/animations/LoadingSpinner';
import NotificationList from '../components/notifications/NotificationList';

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

  // Add effect to handle route changes based on visual role
  useEffect(() => {
    if (location.pathname === '/dashboard' && isVisualAdmin) {
      navigate('/admin');
    } else if (location.pathname.startsWith('/admin') && !isVisualAdmin) {
      navigate('/dashboard');
    }
  }, [location.pathname, isVisualAdmin, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (userProfile && userProfile._id) {  // Check for both userProfile and _id
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('[DEBUG] Initializing WebSocket connection for user:', userProfile._id);
      
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
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
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[DEBUG] WebSocket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          newSocket.connect();
        }
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
    } else {
      console.log('[DEBUG] Cannot initialize WebSocket: userProfile or userProfile._id is missing');
    }
  }, [userProfile, updateWalletBalance]);

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
    { path: '/transfer', icon: ArrowLeftRight, label: t('navigation.transfer') },
    { path: '/bank-transfer', icon: Building2, label: t('navigation.bankTransfer') },
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
    navigate('/dashboard');
  };

  const handleSwitchToAdminView = () => {
    toggleVisualRole();
    navigate('/admin');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} flex`}>
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

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-64 ${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-xl border-gray-800' 
            : 'bg-white border-gray-200'
        } border-r p-6 flex flex-col fixed h-screen overflow-y-auto`}
      >
        <Link to="/" className="flex items-center gap-2 mb-10">
          <Wallet className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DinarFlow
          </span>
        </Link>

        {/* Admin Navigation - Moved to top */}
        {['admin', 'superadmin'].includes(userProfile?.role) && (
          <div className="mb-8">
            <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
              Admin
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
                    Dashboard
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
                    Users
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
                    KYC
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
                    Support
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
                      Settings
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
                  <span className="font-medium">Switch to Admin View</span>
                </button>
              )}
            </nav>
          </div>
        )}

        <nav className="flex-1">
          {isVisualAdmin ? (
            <div className="mb-4">
              <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                User View
              </h3>
              <button
                onClick={handleSwitchToUserView}
                className={`w-full mt-2 px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-400 border border-blue-500/20' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-600 border border-blue-200'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">Switch to User View</span>
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className={`px-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                User View
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
      <main className="flex-1 ml-64 relative">
        {/* Header (always above overlay) */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`sticky top-0 z-40 ${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-xl border-gray-800' 
              : 'bg-white/50 backdrop-blur-xl border-gray-200'
          } border-b px-8 py-4`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-xl">
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
            
            <div className="flex items-center gap-4">
              <NotificationList />
              
              {/* Profile Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800' 
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  } border transition-colors`}
                >
                  {userProfile?.profilePicture ? (
                    <img
                      src={userProfile.profilePicture}
                      alt={userProfile.displayName || t('common.profile')}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium">
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
                      dir={i18n.language === 'ar' ? 'rtl' : undefined}
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

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
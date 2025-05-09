import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Bitcoin,
  Clock,
  UserCircle,
  MessagesSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../assets/animations/LoadingSpinner';
import KYCOverlay from '../layouts/KYCOverlay';

const DashboardLayout = () => {
  const { loading, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const kycStatus = userProfile?.kycStatus || 'unverified';
  const rejectionReason = userProfile?.kycRejectionReason || '';
  const showKycOverlay = kycStatus !== 'verified' && !['/profile', '/settings', '/support'].includes(location.pathname);
  const isKycOverlayPage = !['/profile', '/settings', '/support'].includes(location.pathname);

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

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { path: '/wallet', icon: Wallet, label: t('navigation.wallet') },
    { path: '/transfer', icon: ArrowLeftRight, label: t('navigation.transfer') },
    { path: '/bank-transfer', icon: Building2, label: t('navigation.bankTransfer') },
    { path: '/crypto', icon: Bitcoin, label: t('navigation.crypto') },
    { path: '/history', icon: Clock, label: t('navigation.history') },
    { path: '/profile', icon: UserCircle, label: t('navigation.profile') },
    { path: '/settings', icon: Settings, label: t('navigation.settings') },
    { path: '/support', icon: MessagesSquare, label: 'Support' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
        } border-r p-6 flex flex-col fixed h-screen`}
      >
        <Link to="/" className="flex items-center gap-2 mb-10">
          <Wallet className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DinarFlow
          </span>
        </Link>

        <nav className="flex-1">
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
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
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
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('common.viewProfile')}
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('common.settings')}
                      </Link>
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

        {/* KYC Overlay (now below header, above content) */}
        {showKycOverlay && (
          <KYCOverlay status={kycStatus} rejectionReason={rejectionReason} />
        )}

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
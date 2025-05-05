import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
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
  UserCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/transfer', icon: ArrowLeftRight, label: 'Transfer' },
    { path: '/bank-transfer', icon: Building2, label: 'Bank Transfer' },
    { path: '/crypto', icon: Bitcoin, label: 'Crypto' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} flex`}>
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
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <Link 
            to="/login"
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`sticky top-0 z-10 ${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-xl border-gray-800' 
              : 'bg-white/50 backdrop-blur-xl border-gray-200'
          } border-b px-8 py-4`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                } w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`w-full pl-10 pr-4 py-2 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-800 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 hover:bg-gray-100'
              } border transition-colors`}>
                <img
                  src="https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2"
                  alt="Profile"
                  className="w-6 h-6 rounded-full"
                />
                <span>John Doe</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
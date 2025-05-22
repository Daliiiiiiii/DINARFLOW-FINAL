import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Building2,
  Shield,
  Filter,
  Search,
  ChevronDown,
  Settings,
  Trash2,
  CheckCheck,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Notifications = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const categories = [
    { id: 'all', name: 'All', count: 12 },
    { id: 'transactions', name: 'Transactions', count: 5 },
    { id: 'security', name: 'Security', count: 3 },
    { id: 'system', name: 'System', count: 4 }
  ];

  const notifications = [
    {
      id: 1,
      type: 'transaction',
      title: 'Bank Transfer Completed',
      message: 'Your transfer of 1,500 TND to BNA Bank has been completed.',
      timestamp: '2 minutes ago',
      status: 'unread',
      icon: Building2,
      category: 'transactions',
      color: 'blue'
    },
    {
      id: 2,
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login was detected from Chrome on Windows.',
      timestamp: '15 minutes ago',
      status: 'unread',
      icon: Shield,
      category: 'security',
      color: 'yellow'
    },
    {
      id: 3,
      type: 'transaction',
      title: 'DFLOW Purchase Successful',
      message: 'Successfully purchased 100 DFLOW tokens.',
      timestamp: '1 hour ago',
      status: 'read',
      icon: Wallet,
      category: 'transactions',
      color: 'green'
    }
  ];

  const filteredNotifications = notifications.filter(notification => 
    (selectedCategory === 'all' || notification.category === selectedCategory) &&
    (notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     notification.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400 bg-blue-400/20',
      yellow: 'text-yellow-400 bg-yellow-400/20',
      green: 'text-green-400 bg-green-400/20',
      red: 'text-red-400 bg-red-400/20'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-blue-900/20' : 'bg-blue-100'
            } flex items-center justify-center`}>
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-gray-500 dark:text-gray-400">Stay updated with your account activity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-2`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            } transition-colors flex items-center gap-2`}>
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Categories */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6`}
            >
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full p-3 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category.id
                        ? isDark
                          ? 'bg-blue-900/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : isDark
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedCategory === category.id
                        ? isDark
                          ? 'bg-blue-400/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                        : isDark
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl overflow-hidden`}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search notifications..."
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center gap-2`}
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                    <button className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center gap-2`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark All Read
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-800">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 ${
                      notification.status === 'unread'
                        ? isDark
                          ? 'bg-gray-800/50'
                          : 'bg-gray-50'
                        : ''
                    } transition-colors relative group`}
                  >
                    {notification.status === 'unread' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.color)}`}>
                        <notification.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
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
                <h2 className="text-xl font-semibold">Notification Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'transactions', label: 'Transactions', description: 'Get notified about your transactions' },
                      { id: 'security', label: 'Security Alerts', description: 'Important security notifications' },
                      { id: 'news', label: 'News & Updates', description: 'Stay updated with platform news' }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'daily', label: 'Daily Summary', description: 'Receive a daily activity summary' },
                      { id: 'marketing', label: 'Marketing', description: 'Promotional offers and updates' }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
  );
};

export default Notifications;
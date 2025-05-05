import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Lock, 
  CreditCard, 
  Smartphone,
  Mail,
  AlertTriangle,
  X,
  ChevronRight,
  Shield,
  LogOut
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    transactions: true,
    marketing: false,
    security: true
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-blue-400" />
                  )}
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isDark ? 'Dark mode is enabled' : 'Light mode is enabled'}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isDark}
                    onChange={toggleTheme}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </motion.div>

            {/* Notifications */}
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
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications about your account activity
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Receive important updates via email
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications via SMS
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.sms}
                      onChange={() => handleNotificationChange('sms')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Notification Categories
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Transactions</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.transactions}
                        onChange={() => handleNotificationChange('transactions')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">Marketing</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.marketing}
                        onChange={() => handleNotificationChange('marketing')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">Security</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.security}
                        onChange={() => handleNotificationChange('security')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security */}
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
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <div className="space-y-4">
                <button className={`w-full p-4 rounded-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}>
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium">Change Password</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Update your account password
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>

                <button className={`w-full p-4 rounded-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Add an extra layer of security
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>

                <button className={`w-full p-4 rounded-lg ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors flex items-center justify-between group`}>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium">Payment Methods</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your payment methods
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Account Info */}
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
              <h2 className="text-lg font-semibold mb-4">Account Info</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                  <div className="font-medium">john@example.com</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                  <div className="font-medium">+216 12 345 678</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Member Since</div>
                  <div className="font-medium">March 2024</div>
                </div>
              </div>
            </motion.div>

            {/* Language */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Language</h2>
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <select className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg`}
            >
              <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Delete Account
                </button>
                <button className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
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
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`${
                  isDark
                    ? 'bg-red-900/20'
                    : 'bg-red-50'
                } p-4 rounded-lg flex items-start gap-3`}>
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">Warning</p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-red-500'
                        : 'border-gray-300 focus:border-red-500'
                    } focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`}
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Settings;
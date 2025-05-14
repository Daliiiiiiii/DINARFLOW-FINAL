import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  Lock,
  Shield,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  Database,
  Globe,
  Wallet,
  Building2,
  Bitcoin
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleSave = () => {
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showSuccessAlert ? 1 : 0, y: showSuccessAlert ? 0 : -20 }}
          className={`${
            isDark
              ? 'bg-green-900/20'
              : 'bg-green-50'
          } p-4 rounded-lg flex items-start gap-3 ${showSuccessAlert ? '' : 'hidden'}`}
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">Settings saved successfully</p>
            <p className="text-green-600 dark:text-green-300 text-sm mt-1">
              Your changes have been saved and will take effect immediately.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showErrorAlert ? 1 : 0, y: showErrorAlert ? 0 : -20 }}
          className={`${
            isDark
              ? 'bg-red-900/20'
              : 'bg-red-50'
          } p-4 rounded-lg flex items-start gap-3 ${showErrorAlert ? '' : 'hidden'}`}
        >
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">Error saving settings</p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              There was a problem saving your changes. Please try again.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">Security</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Two-Factor Authentication</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Require 2FA for all admin actions
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Session Timeout</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Automatically log out after inactivity
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">IP Whitelist</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Restrict admin access to specific IP addresses
                </p>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
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
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">KYC Requests</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Notify when new KYC verification requests are submitted
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Support Tickets</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Notify when new support tickets are created
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Large Transactions</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Notify for transactions over 10,000 TND
                </p>
              </div>
            </div>
          </motion.div>

          {/* System Settings */}
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
            <h2 className="text-xl font-semibold mb-6">System</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Maintenance Mode</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enable maintenance mode for system updates
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Error Logging</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set the minimum log level for system events
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Backup Schedule</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set the frequency of system backups
                </p>
              </div>
            </div>
          </motion.div>

          {/* Transaction Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">Transactions</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Transaction Limits</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Daily Limit (TND)</label>
                    <input
                      type="number"
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      defaultValue="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Per Transaction</label>
                    <input
                      type="number"
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      defaultValue="5000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Auto-approve Transactions</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Automatically approve transactions under 1,000 TND
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">Fraud Detection</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enable AI-powered fraud detection system
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Database className="w-5 h-5 text-blue-400" />
              Backup Database
            </button>
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Key className="w-5 h-5 text-blue-400" />
              Rotate API Keys
            </button>
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Shield className="w-5 h-5 text-blue-400" />
              Security Audit
            </button>
          </div>
        </motion.div>
      </div>
  );
};

export default Settings;
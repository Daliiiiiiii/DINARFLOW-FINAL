import React from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowRight, Users, Building2, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';

const Transfer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transfer Money</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Quick Transfer</h2>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Available Balance</div>
                <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">24,500.00 TND</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  placeholder="Enter email or phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (TND)
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  placeholder="Add a note"
                />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Money
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}>
              <h2 className="text-lg font-semibold mb-4">Transfer Methods</h2>
              <div className="space-y-3">
                <button className={`w-full ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } p-4 rounded-lg transition-colors flex items-center gap-3 group`}>
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="flex-1 text-left font-medium">To DinarFlow User</span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>
                <button className={`w-full ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } p-4 rounded-lg transition-colors flex items-center gap-3 group`}>
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="flex-1 text-left font-medium">To Bank Account</span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>
                <button className={`w-full ${
                  isDark
                    ? 'bg-gray-800/50 hover:bg-gray-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } p-4 rounded-lg transition-colors flex items-center gap-3 group`}>
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="flex-1 text-left font-medium">To Crypto Wallet</span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                </button>
              </div>
            </div>

            <div className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6 shadow-lg`}>
              <h2 className="text-lg font-semibold mb-4">Recent Recipients</h2>
              <div className="space-y-3">
                {[
                  { name: 'Sarah Smith', email: 'sarah@example.com' },
                  { name: 'John Doe', email: 'john@example.com' },
                  { name: 'Emma Wilson', email: 'emma@example.com' }
                ].map((recipient, index) => (
                  <button
                    key={index}
                    className={`w-full ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } p-3 rounded-lg transition-colors text-left`}
                  >
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{recipient.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transfer;
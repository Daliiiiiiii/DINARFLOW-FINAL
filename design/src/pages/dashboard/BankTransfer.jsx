import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Clock, AlertCircle, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';

const BankTransfer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bank Transfer</h1>

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
              <h2 className="text-lg font-semibold">Transfer to Bank</h2>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Available Balance</div>
                <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">24,500.00 TND</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number (RIB)
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  placeholder="Enter 20-digit RIB number"
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
                  Description
                </label>
                <textarea
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  placeholder="Add a description for this transfer"
                  rows={3}
                />
              </div>
              <div className={`${
                isDark
                  ? 'bg-blue-900/20'
                  : 'bg-blue-50'
              } p-4 rounded-lg flex items-start gap-3`}>
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Processing Time</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Transfers typically complete within 1-2 business days</p>
                </div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Building2 className="w-4 h-4" />
                Transfer to Bank
              </button>
            </div>
          </motion.div>

          <div className="space-y-6">
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
              <h2 className="text-lg font-semibold mb-4">Saved Bank Accounts</h2>
              <div className="space-y-3">
                {[
                  { bank: 'Banque Nationale Agricole', account: '•••• 4589', balance: '12,450.00 TND' },
                  { bank: 'Attijari Bank', account: '•••• 7823', balance: '8,320.00 TND' },
                  { bank: 'BIAT', account: '•••• 1234', balance: '15,600.00 TND' }
                ].map((account, index) => (
                  <button
                    key={index}
                    className={`w-full ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } p-4 rounded-lg transition-colors flex items-center gap-3 group`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{account.bank}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{account.account}</div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{account.balance}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
                  </button>
                ))}
              </div>
            </motion.div>

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
              <h2 className="text-lg font-semibold mb-4">Important Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Bank transfers are subject to standard banking hours and may take 1-2 business days to complete.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Transfer fees may apply depending on your bank and transfer amount.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BankTransfer;
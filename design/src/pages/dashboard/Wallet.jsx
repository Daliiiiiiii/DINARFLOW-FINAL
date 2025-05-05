import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, CreditCard, QrCode } from 'lucide-react';

const Wallet = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const wallets = [
    {
      name: 'TND Wallet',
      balance: '24,500.00',
      currency: 'TND',
      change: '+2.5%',
      isPositive: true
    },
    {
      name: 'DFLOW Wallet',
      balance: '1,250.00',
      currency: 'DFLOW',
      change: '-1.2%',
      isPositive: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <WalletIcon className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`flex items-center text-sm ${
                  wallet.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {wallet.change}
                  {wallet.isPositive ? (
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 ml-1" />
                  )}
                </span>
              </div>
              <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>
                {wallet.name}
              </h3>
              <p className="text-3xl font-semibold mb-6">
                {wallet.currency} {wallet.balance}
              </p>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                  Send
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
                  Receive
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-3`}>
              <CreditCard className="w-5 h-5 text-blue-400" />
              Add Money
            </button>
            <button className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-3`}>
              <QrCode className="w-5 h-5 text-blue-400" />
              Scan QR Code
            </button>
            <button className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-3`}>
              <WalletIcon className="w-5 h-5 text-blue-400" />
              Manage Wallets
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[
              {
                type: 'Received',
                amount: '+500 TND',
                from: 'Ahmed Ben Ali',
                date: '2024-03-15 14:30',
                isPositive: true
              },
              {
                type: 'Sent',
                amount: '-250 DFLOW',
                from: 'Sarah Smith',
                date: '2024-03-15 12:45',
                isPositive: false
              },
              {
                type: 'Added',
                amount: '+1000 TND',
                from: 'Bank Transfer',
                date: '2024-03-15 10:20',
                isPositive: true
              }
            ].map((activity, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {activity.isPositive ? (
                      <ArrowDownRight className={`w-5 h-5 ${
                        activity.isPositive ? 'text-green-400' : 'text-red-400'
                      }`} />
                    ) : (
                      <ArrowUpRight className={`w-5 h-5 ${
                        activity.isPositive ? 'text-green-400' : 'text-red-400'
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.from}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    activity.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.amount}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;
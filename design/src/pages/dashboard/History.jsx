import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Wallet, Building2, Search, Calendar, Filter } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';

const History = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [typeFilter, setTypeFilter] = useState('all');

  const transactions = [
    {
      id: 1,
      type: 'received',
      amount: '250.00',
      currency: 'TND',
      from: 'Sarah Smith',
      date: '2024-03-15 14:30',
      status: 'completed',
      description: 'Monthly rent'
    },
    {
      id: 2,
      type: 'sent',
      amount: '50.00',
      currency: 'TND',
      to: 'John Doe',
      date: '2024-03-14 12:45',
      status: 'completed',
      description: 'Dinner payment'
    },
    {
      id: 3,
      type: 'crypto',
      amount: '100.00',
      currency: 'DFLOW',
      date: '2024-03-13 10:15',
      status: 'completed',
      description: 'Converted from TND'
    },
    {
      id: 4,
      type: 'bank',
      amount: '1000.00',
      currency: 'TND',
      to: 'BNA Bank',
      date: '2024-03-12 09:30',
      status: 'pending',
      description: 'Bank transfer'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="flex items-center gap-3">
            <button className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-2`}>
              <Calendar className="w-4 h-4" />
              Export
            </button>
            <button className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-2`}>
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl shadow-lg overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                >
                  <option value="all">All Types</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                  <option value="crypto">Crypto</option>
                  <option value="bank">Bank</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <motion.tr 
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`group hover:${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    } transition-colors cursor-pointer`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'received' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        {transaction.type === 'sent' && (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        {transaction.type === 'crypto' && (
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        {transaction.type === 'bank' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.from || transaction.to}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${
                        transaction.type === 'sent' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {transaction.type === 'sent' ? '-' : '+'}{transaction.amount} {transaction.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{transaction.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing 1 to 4 of 4 entries
              </div>
              <div className="flex items-center gap-2">
                <button className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}>
                  Previous
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default History;
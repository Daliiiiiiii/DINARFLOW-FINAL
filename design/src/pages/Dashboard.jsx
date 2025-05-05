import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  Coins
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 6890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Balance',
              value: 'TND 24,500.00',
              change: '+2.5%',
              isPositive: true,
              icon: Wallet
            },
            {
              title: 'DFLOW Balance',
              value: '1,250 DFLOW',
              change: '-1.2%',
              isPositive: false,
              icon: Coins
            },
            {
              title: '24h Volume',
              value: 'TND 156,000',
              change: '+5.3%',
              isPositive: true,
              icon: BarChart3
            },
            {
              title: 'Active Users',
              value: '2,450',
              change: '+12.5%',
              isPositive: true,
              icon: Users
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
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
                  <stat.icon className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`flex items-center text-sm ${
                  stat.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 ml-1" />
                  )}
                </span>
              </div>
              <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>
                {stat.title}
              </h3>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <h3 className="text-xl font-semibold mb-6">Balance History</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#1F2937' : '#E5E7EB'} 
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <YAxis 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '0.5rem',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h3 className="text-xl font-semibold mb-6">DFLOW Price</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#1F2937' : '#E5E7EB'} 
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <YAxis 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '0.5rem',
                      color: isDark ? '#FFFFFF' : '#111827'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h3 className="text-xl font-semibold mb-6">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm border-b ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <th className="text-left pb-4">Type</th>
                  <th className="text-left pb-4">Amount</th>
                  <th className="text-left pb-4">Status</th>
                  <th className="text-left pb-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: 'Sent DFLOW',
                    amount: '-250 DFLOW',
                    status: 'Completed',
                    date: '2024-03-15 14:30'
                  },
                  {
                    type: 'Received TND',
                    amount: '+1,500 TND',
                    status: 'Completed',
                    date: '2024-03-15 12:45'
                  },
                  {
                    type: 'Bought DFLOW',
                    amount: '+100 DFLOW',
                    status: 'Pending',
                    date: '2024-03-15 10:20'
                  }
                ].map((tx, index) => (
                  <tr key={index} className={`border-b ${
                    isDark ? 'border-gray-800/50' : 'border-gray-200/50'
                  }`}>
                    <td className="py-4">{tx.type}</td>
                    <td className={`py-4 ${
                      tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>{tx.amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'Completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
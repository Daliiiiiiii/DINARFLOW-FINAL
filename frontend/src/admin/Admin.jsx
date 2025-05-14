import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  LineChart,
  PieChart,
  Map,
  Activity,
  TrendingUp,
  Clock,
  AlertOctagon,
  UserCheck,
  UserX,
  Circle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../lib/axios';
import io from 'socket.io-client';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Admin = () => {
  const { theme } = useTheme();
  const { showError } = useNotification();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    volume24h: 0,
    activeWallets: 0,
    transactions: {
      completed: 0,
      pending: 0,
      failed: 0
    }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      showError('Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const userMetrics = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      change: '+12%',
      isPositive: true,
      icon: Users
    },
    {
      title: 'Active Wallets',
      value: formatNumber(stats.activeWallets),
      change: '+8%',
      isPositive: true,
      icon: Wallet
    },
    {
      title: '24h Volume',
      value: formatCurrency(stats.volume24h),
      change: '+25%',
      isPositive: true,
      icon: Activity
    }
  ];

  const alerts = [
    {
      type: 'high_volume',
      message: 'Unusual transaction volume detected',
      severity: 'warning',
      time: '5 minutes ago'
    },
    {
      type: 'suspicious',
      message: 'Multiple failed login attempts',
      severity: 'critical',
      time: '15 minutes ago'
    },
    {
      type: 'system',
      message: 'System performance degradation',
      severity: 'warning',
      time: '1 hour ago'
    }
  ];

  const insights = [
    {
      title: 'Pending KYC',
      value: formatNumber(stats.pendingKyc),
      change: '-5%',
      isPositive: true,
      icon: ShieldCheck
    },
    {
      title: 'Completed Transactions',
      value: formatNumber(stats.transactions?.completed || 0),
      change: '+8%',
      isPositive: true,
      icon: CheckCircle
    },
    {
      title: 'Failed Transactions',
      value: formatNumber(stats.transactions?.failed || 0),
      change: '-2%',
      isPositive: true,
      icon: XCircle
    }
  ];

  // Dummy data for charts
  const activityData = [
    { hour: '00:00', users: 120, transactions: 45 },
    { hour: '04:00', users: 80, transactions: 30 },
    { hour: '08:00', users: 250, transactions: 120 },
    { hour: '12:00', users: 380, transactions: 180 },
    { hour: '16:00', users: 420, transactions: 210 },
    { hour: '20:00', users: 280, transactions: 150 }
  ];

  const regionData = [
    { name: 'Tunis', users: 4500, volume: '1.2M' },
    { name: 'Sfax', users: 2800, volume: '850K' },
    { name: 'Sousse', users: 2200, volume: '620K' },
    { name: 'Bizerte', users: 1800, volume: '480K' }
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userMetrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${
                  isDark 
                    ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                    : 'bg-white border-gray-200'
                } border rounded-xl p-6 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <metric.icon className="w-8 h-8 text-blue-400" />
                    <span className={`flex items-center text-sm ${
                      metric.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.change}
                      {metric.isPositive ? (
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 ml-1" />
                      )}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-1">{metric.title}</h3>
                  <p className="text-3xl font-bold">{metric.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Activity Chart */}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">24h Activity</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full" />
                  <span className="text-sm text-gray-400">Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full" />
                  <span className="text-sm text-gray-400">Transactions</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C084FC" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#C084FC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#1F2937' : '#E5E7EB'} 
                  />
                  <XAxis 
                    dataKey="hour" 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <YAxis 
                    stroke={isDark ? '#6B7280' : '#4B5563'} 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#60A5FA" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#C084FC"
                    fillOpacity={1} 
                    fill="url(#colorTransactions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Insights & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <h2 className="text-xl font-semibold mb-6">Key Insights</h2>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <insight.icon className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {insight.title}
                          </p>
                          <p className="font-medium">{insight.value}</p>
                        </div>
                      </div>
                      <span className={`flex items-center text-sm ${
                        insight.isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {insight.change}
                        {insight.isPositive ? (
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 ml-1" />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

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
              <h2 className="text-xl font-semibold mb-6">Active Alerts</h2>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      alert.severity === 'critical'
                        ? isDark
                          ? 'bg-red-900/20 border-red-800'
                          : 'bg-red-50 border-red-200'
                        : isDark
                          ? 'bg-yellow-900/20 border-yellow-800'
                          : 'bg-yellow-50 border-yellow-200'
                    } border`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <div className="flex-1">
                        <p className={`font-medium ${
                          alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
import React, { useEffect, useState } from 'react';
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
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  ArrowUp,
  ArrowDown,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  BarChart3,
  Users
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ActionLoader from '../assets/animations/ActionLoader';
import KYCOverlay from '../layouts/KYCOverlay';

const COLORS = ['#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

const Dashboard = () => {
  const { theme } = useTheme();
  const { transactions, loading, fetchTransactions } = useTransactions();
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState({
    totalBalance: 0,
    dflowBalance: 0,
    totalIncome: 0,
    totalOutcome: 0,
    avgTransaction: 0,
    transactionCount: 0
  });

  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [currencyBreakdown, setCurrencyBreakdown] = useState([]);
  const [hasData, setHasData] = useState(false);

  // Show KYCOverlay if user is not verified
  const showKycOverlay = userProfile && userProfile.kycStatus !== 'verified';

  // Dummy data for unverified users
  const dummyStats = {
    totalBalance: 24500.00,
    dflowBalance: 1250,
    volume24h: 156000,
    activeUsers: 2450
  };
  const dummyChartData = [
    { name: 'Jan', value: 4000, income: 3000, outcome: 1000 },
    { name: 'Feb', value: 3000, income: 2000, outcome: 1000 },
    { name: 'Mar', value: 5000, income: 3500, outcome: 1500 },
    { name: 'Apr', value: 2780, income: 2000, outcome: 780 },
    { name: 'May', value: 6890, income: 5000, outcome: 1890 },
    { name: 'Jun', value: 2390, income: 1500, outcome: 890 },
    { name: 'Jul', value: 3490, income: 2500, outcome: 990 },
  ];
  const dummyPieData = [
    { name: 'received TND', value: 6 },
    { name: 'sent TND', value: 4 },
    { name: 'received DFLOW', value: 1 },
    { name: 'sent DFLOW', value: 1 }
  ];
  const dummyCurrencyBreakdown = [
    { currency: 'TND', income: 3000, outcome: 1500 },
    { currency: 'DFLOW', income: 500, outcome: 200 }
  ];
  const dummyTransactions = [
    {
      type: 'Sent TND',
      amount: '-250 TND',
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
      type: 'Sent TND',
      amount: '-100 TND',
      status: 'Pending',
      date: '2024-03-15 10:20'
    }
  ];

  // If user is unverified, use dummy data for dashboard content
  const isUnverified = userProfile?.kycStatus !== 'verified';
  const statsToUse = isUnverified ? dummyStats : stats;
  const chartDataToUse = isUnverified ? dummyChartData : chartData;
  const pieDataToUse = isUnverified ? dummyPieData : pieData;
  const currencyBreakdownToUse = isUnverified ? dummyCurrencyBreakdown : currencyBreakdown;
  const transfersToUse = isUnverified ? dummyTransactions : transactions;

  // Stats cards config
  const statsCards = isUnverified
    ? [
        {
          title: 'Wallet Balance',
          value: '24,500.00 TND',
          change: '+2.5%',
          isPositive: true,
          icon: Wallet
        },
        {
          title: 'Bank Account Balance',
          value: '1,250 TND',
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
      ]
    : [
        {
          title: t('dashboard.walletBalance') || 'Wallet Balance',
          value: `TND ${statsToUse.totalBalance.toFixed(2)}`,
          change: '+2.5%',
          isPositive: true,
          icon: Wallet
        },
        {
          title: t('dashboard.bankAccountBalance') || 'Bank Account Balance',
          value: `${statsToUse.dflowBalance.toFixed(2)} DFLOW`,
          change: '-1.2%',
          isPositive: false,
          icon: Coins
        },
        {
          title: t('dashboard.totalIncome'),
          value: `TND ${statsToUse.totalIncome.toFixed(2)}`,
          change: '+5.3%',
          isPositive: true,
          icon: BarChart3
        },
        {
          title: t('dashboard.transactionCount'),
          value: `${statsToUse.transactionCount}`,
          change: '+12.5%',
          isPositive: true,
          icon: Users
        }
      ];

  useEffect(() => {
    if (!transactions.length) {
      setHasData(false);
      return;
    }

    setHasData(true);
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - parseInt(timeRange)));

    const filteredTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= startDate
    );

    // Calculate basic stats
    const income = filteredTransactions
      .filter(t => t.type === 'received')
      .reduce((acc, t) => acc + t.amount, 0);

    const outcome = filteredTransactions
      .filter(t => t.type === 'sent')
      .reduce((acc, t) => acc + t.amount, 0);

    const dflowBalance = filteredTransactions
      .filter(t => t.currency === 'DFLOW')
      .reduce((acc, t) => {
        if (t.type === 'received') return acc + t.amount;
        if (t.type === 'sent') return acc - t.amount;
        return acc;
      }, 0);

    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions > 0 
      ? (income + outcome) / totalTransactions 
      : 0;

    setStats({
      totalBalance: currentUser?.balance || 0,
      dflowBalance,
      totalIncome: income,
      totalOutcome: outcome,
      avgTransaction,
      transactionCount: totalTransactions
    });

    // Prepare daily chart data
    const dailyData = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, outcome: 0 };
      }
      if (t.type === 'received') {
        dailyData[date].income += t.amount;
      } else {
        dailyData[date].outcome += t.amount;
      }
    });

    const chartDataArray = Object.entries(dailyData).map(([date, data]) => ({
      date,
      income: data.income,
      outcome: data.outcome
    }));

    setChartData(chartDataArray);

    // Prepare pie chart data
    const typeCounts = filteredTransactions.reduce((acc, t) => {
      const key = `${t.type}-${t.currency}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const pieDataArray = Object.entries(typeCounts).map(([key, value]) => {
      const [type, currency] = key.split('-');
      return {
        name: `${type} ${currency}`,
        value
      };
    });

    setPieData(pieDataArray);

    // Prepare currency breakdown
    const currencyData = filteredTransactions.reduce((acc, t) => {
      if (!acc[t.currency]) {
        acc[t.currency] = { income: 0, outcome: 0 };
      }
      if (t.type === 'received') {
        acc[t.currency].income += t.amount;
      } else {
        acc[t.currency].outcome += t.amount;
      }
      return acc;
    }, {});

    const currencyBreakdownArray = Object.entries(currencyData).map(([currency, data]) => ({
      currency,
      ...data
    }));

    setCurrencyBreakdown(currencyBreakdownArray);
  }, [transactions, currentUser, timeRange]);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Currency', 'Status'],
      ...transactions.map(t => [
        new Date(t.createdAt).toLocaleString(),
        t.type,
        t.amount,
        t.currency,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <ActionLoader isLoading={true} />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      </>
    );
  }

  if (!hasData && userProfile?.kycStatus === 'verified') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="flex flex-col items-center">
          <svg width="96" height="96" fill="none" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="46" fill="#F3F4F6" stroke="#CBD5E1" strokeWidth="4" />
            <path d="M32 60c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="40" cy="44" r="3" fill="#A5B4FC" />
            <circle cx="56" cy="44" r="3" fill="#A5B4FC" />
            <ellipse cx="48" cy="68" rx="8" ry="3" fill="#E0E7EF" />
          </svg>
          <h2 className="mt-6 text-2xl font-bold text-gray-700">{t('dashboard.welcome')}</h2>
          <p className="mt-2 text-gray-500 text-lg text-center max-w-md">
            {t('dashboard.noTransactions')}<br />
            {t('dashboard.startBy')}
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
          >
            <RefreshCw className="w-5 h-5" />
            {t('dashboard.refreshData')}
          </button>
          <a
            href="/transfer"
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow"
          >
            <ArrowUpRight className="w-5 h-5" />
            {t('dashboard.makeTransfer')}
          </a>
        </div>
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg px-6 py-4 text-blue-700 text-center max-w-lg">
          <strong>{t('dashboard.tip')}:</strong> {t('dashboard.tipText')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showKycOverlay && (
        <KYCOverlay
          status={userProfile?.kycStatus}
          rejectionReason={userProfile?.kycRejectionReason}
          centered
        />
      )}
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-800/50 border-gray-700 text-white'
                : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isUnverified}
          >
            <option value="7">{t('dashboard.last7Days')}</option>
            <option value="30">{t('dashboard.last30Days')}</option>
            <option value="90">{t('dashboard.last90Days')}</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
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
              <AreaChart data={isUnverified ? dummyChartData : chartData}>
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
                  dataKey={isUnverified ? 'name' : 'date'}
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
                  dataKey={isUnverified ? 'value' : 'income'}
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Balance"
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
          <h3 className="text-xl font-semibold mb-6">Income vs Outcome</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={isUnverified ? dummyChartData : chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutcome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#1F2937' : '#E5E7EB'} 
                />
                <XAxis 
                  dataKey={isUnverified ? 'name' : 'date'}
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
                  dataKey="income"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="outcome"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorOutcome)"
                  name="Outcome"
                />
              </AreaChart>
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
              {(isUnverified ? dummyTransactions : transactions.slice(0, 5)).map((tx, index) => (
                <tr key={index} className={`border-b ${
                  isDark ? 'border-gray-800/50' : 'border-gray-200/50'
                }`}>
                  <td className="py-4">{tx.type || tx.type}</td>
                  <td className={`py-4 ${
                    (tx.amount || '').toString().startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>{tx.amount || (tx.type === 'received' ? '+' : '-') + tx.amount + ' ' + tx.currency}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (tx.status === 'Completed' || tx.status === 'completed')
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status || tx.status}
                    </span>
                  </td>
                  <td className={`py-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{tx.date || new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
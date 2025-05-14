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
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
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
    monthlyIncome: 0,
    monthlyExpenses: 0,
    volume24h: 0,
    transactions: {
      total: 0,
      sent: 0,
      received: 0
    }
  });

  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [currencyBreakdown, setCurrencyBreakdown] = useState([]);
  const [hasData, setHasData] = useState(false);

  // Show KYCOverlay if user is not verified
  const showKycOverlay = currentUser && currentUser.kyc?.status !== 'verified';
  const kycStatus = currentUser?.kyc?.status || 'unverified';
  const rejectionReason = currentUser?.kyc?.verificationNotes || '';

  // Mock data for development
  const mockStats = {
    totalBalance: 5000,
    monthlyIncome: 2500,
    monthlyExpenses: 1500,
    volume24h: 156000,
    transactions: {
      total: 25,
      sent: 10,
      received: 15
    }
  };

  const mockTransactions = [
    {
      id: 1,
      type: 'transfer',
      subtype: 'send',
      amount: -100,
      currency: 'TND',
      recipient: 'John Doe',
      date: '2024-03-15 14:30:22',
      status: 'completed'
    },
    {
      id: 2,
      type: 'transfer',
      subtype: 'receive',
      amount: 200,
      currency: 'TND',
      sender: 'Jane Smith',
      date: '2024-03-14 09:15:45',
      status: 'completed'
    },
    {
      id: 3,
      type: 'bank',
      subtype: 'withdrawal',
      amount: -500,
      currency: 'TND',
      recipient: 'Bank of Tunisia',
      date: '2024-03-15 16:45:30',
      status: 'pending'
    }
  ];

  // Generate localized month names
  const getMonthName = (monthIndex) => {
    const name = new Date(2024, monthIndex).toLocaleString(i18n.language, { month: 'short' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const mockChartData = [
    { name: getMonthName(0), income: 3000, outcome: 1500 },
    { name: getMonthName(1), income: 2000, outcome: 1000 },
    { name: getMonthName(2), income: 3500, outcome: 1500 },
    { name: getMonthName(3), income: 2000, outcome: 780 },
    { name: getMonthName(4), income: 5000, outcome: 1890 },
    { name: getMonthName(5), income: 1500, outcome: 890 }
  ];

  const statsCards = [
    {
      title: t('dashboard.totalBalance'),
      value: mockStats.totalBalance.toFixed(2),
      icon: Wallet,
      trend: '+5.2%',
      trendType: 'up'
    },
    {
      title: t('dashboard.monthlyIncome'),
      value: mockStats.monthlyIncome.toFixed(2),
      icon: TrendingUp,
      trend: '+2.1%',
      trendType: 'up'
    },
    {
      title: t('dashboard.monthlyExpenses'),
      value: mockStats.monthlyExpenses.toFixed(2),
      icon: TrendingDown,
      trend: '-1.5%',
      trendType: 'down'
    },
    {
      title: t('dashboard.volume24h'),
      value: mockStats.volume24h.toLocaleString(),
      icon: BarChart3,
      trend: '+8.3%',
      trendType: 'up'
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
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const outcome = filteredTransactions
      .filter(t => t.type === 'sent')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalTransactions = filteredTransactions.length;

    setStats({
      totalBalance: currentUser?.balance || 0,
      monthlyIncome: income,
      monthlyExpenses: outcome,
      volume24h: 0,
      transactions: {
        total: totalTransactions,
        sent: filteredTransactions.filter(t => t.type === 'sent').length,
        received: filteredTransactions.filter(t => t.type === 'received').length
      }
    });

    // Prepare daily chart data
    const dailyData = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, outcome: 0 };
      }
      if (t.type === 'received') {
        dailyData[date].income += (t.amount || 0);
      } else {
        dailyData[date].outcome += (t.amount || 0);
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
      const key = t.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const pieDataArray = Object.entries(typeCounts).map(([type, value]) => ({
      name: type,
      value
    }));

    setPieData(pieDataArray);

  }, [transactions, currentUser, timeRange, t]);

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
    <div className="relative">
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
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
            disabled={!!showKycOverlay}
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
                stat.trendType === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.trend}
                {stat.trendType === 'up' ? (
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
          <h3 className="text-xl font-semibold mb-6">{t('dashboard.balanceHistory')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={showKycOverlay ? mockChartData : chartData}>
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
                  dataKey="income"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name={t('dashboard.totalBalance')}
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
          <h3 className="text-xl font-semibold mb-6">{t('dashboard.incomeVsOutcome')}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={showKycOverlay ? mockChartData : chartData}>
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
                  dataKey="income"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name={t('dashboard.monthlyIncome')}
                />
                <Area
                  type="monotone"
                  dataKey="outcome"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorOutcome)"
                  name={t('dashboard.monthlyExpenses')}
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
        <h3 className="text-xl font-semibold mb-6">{t('dashboard.recentTransactions')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} pb-4`}>{t('history.type')}</th>
                <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} pb-4`}>{t('history.amount')}</th>
                <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} pb-4`}>{t('history.status')}</th>
                <th className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} pb-4`}>{t('history.date')}</th>
              </tr>
            </thead>
            <tbody>
              {(showKycOverlay ? mockTransactions : transactions.slice(0, 5)).map((tx, index) => {
                // Format transaction type
                const formattedType = `${t(`history.${tx.type}`)}${tx.subtype ? ' - ' + t(`wallet.${tx.subtype}`) : ''}`;

                // Format amount with proper sign
                const amount = tx.amount || 0;
                const formattedAmount = `${amount > 0 ? '+' : ''}${amount} ${tx.currency || 'TND'}`;

                // Format status
                const status = tx.status?.toLowerCase() || 'pending';
                const formattedStatus = t(`status.${status}`);

                // Format date
                const formattedDate = tx.date || new Date(tx.createdAt).toLocaleString();

                return (
                  <tr key={index} className={`border-b ${
                    isDark ? 'border-gray-800/50' : 'border-gray-200/50'
                  }`}>
                    <td className={`py-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{formattedType}</td>
                    <td className={`py-4 ${amount > 0 ? 'text-green-400' : 'text-red-400'} ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{formattedAmount}</td>
                    <td className={`py-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {formattedStatus}
                      </span>
                    </td>
                    <td className={`py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{formattedDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
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
  TrendingDown,
  ChevronDown
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

  // Mock data for development and non-verified users
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

  // Generate mock balance history data
  const generateMockBalanceHistory = () => {
    const data = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30); // Last 30 days

    let balance = 5000; // Start with a reasonable balance
    let totalIncome = 0;
    let totalOutcome = 0;
    let day = new Date(startDate);

    // Generate more realistic transaction patterns
    const generateDailyTransactions = () => {
      const transactions = [];
      const numTransactions = Math.floor(Math.random() * 3); // 0-2 transactions per day
      
      for (let i = 0; i < numTransactions; i++) {
        const isIncome = Math.random() > 0.6; // 40% chance of income
        const amount = isIncome 
          ? Math.floor(Math.random() * 2000) + 500 // Income: 500-2500
          : Math.floor(Math.random() * 1500) + 200; // Expenses: 200-1700
        
        transactions.push({
          type: isIncome ? 'income' : 'expense',
          amount: amount // Always positive, we'll track type separately
        });
      }
      
      return transactions;
    };

    while (day <= now) {
      const dailyTransactions = generateDailyTransactions();
      let dayIncome = 0;
      let dayExpenses = 0;

      dailyTransactions.forEach(tx => {
        if (tx.type === 'income') {
          dayIncome += tx.amount;
          balance += tx.amount;
          totalIncome += tx.amount;
        } else {
          dayExpenses += tx.amount;
          balance -= tx.amount;
          totalOutcome += tx.amount;
        }
      });

      // Ensure balance doesn't go below 0
      if (balance < 0) {
        const adjustment = Math.abs(balance);
        dayExpenses -= adjustment;
        totalOutcome -= adjustment;
        balance = 0;
      }

      data.push({
        name: day.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
        income: totalIncome, // Cumulative income
        outcome: totalOutcome, // Cumulative outcome
        balance: balance
      });

      day.setDate(day.getDate() + 1);
    }

    return data;
  };

  const mockChartData = generateMockBalanceHistory();

  const statsCards = [
    {
      title: t('dashboard.totalBalance'),
      value: showKycOverlay ? mockStats.totalBalance.toFixed(2) : (currentUser?.walletBalance || 0).toFixed(2),
      icon: Wallet,
      trend: '+5.2%',
      trendType: 'up'
    },
    {
      title: t('dashboard.monthlyIncome'),
      value: showKycOverlay ? mockStats.monthlyIncome.toFixed(2) : stats.monthlyIncome.toFixed(2),
      icon: TrendingUp,
      trend: '+2.1%',
      trendType: 'up'
    },
    {
      title: t('dashboard.monthlyExpenses'),
      value: showKycOverlay ? mockStats.monthlyExpenses.toFixed(2) : stats.monthlyExpenses.toFixed(2),
      icon: TrendingDown,
      trend: '-1.5%',
      trendType: 'down'
    },
    {
      title: t('dashboard.volume24h'),
      value: showKycOverlay ? mockStats.volume24h.toLocaleString() : stats.volume24h.toLocaleString(),
      icon: BarChart3,
      trend: '+8.3%',
      trendType: 'up'
    }
  ];

  useEffect(() => {
    // Fetch transactions when component mounts
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!transactions || transactions.length === 0 || showKycOverlay) {
      setHasData(false);
      return;
    }

    setHasData(true);
    
    // Normalize user ID
    const userId = String(currentUser?._id || currentUser?.id);
    // Get the current date and calculate the start date based on timeRange
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - parseInt(timeRange));

    // Sort all transactions by date ascending
    const allSorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Find the balance at the start of the range
    let balance = 0;
    for (const t of allSorted) {
      const tDate = new Date(t.createdAt);
      if (tDate < startDate) {
        if (t.type === 'transfer') {
          if (t.subtype === 'send' && String(t.userId) === userId) balance -= Math.abs(t.amount);
          if (t.subtype === 'receive' && String(t.recipientId) === userId) balance += Math.abs(t.amount);
        }
        if (t.type === 'bank') {
          if (t.subtype === 'deposit' && String(t.userId) === userId) balance += Math.abs(t.amount);
          if (t.subtype === 'withdrawal' && String(t.userId) === userId) balance -= Math.abs(t.amount);
        }
      }
    }

    // Filter transactions within the time range
    const filteredTransactions = allSorted.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= now;
    });

    // Calculate income (money received)
    const income = filteredTransactions.reduce((acc, t) => {
      if (
        (t.type === 'transfer' && t.subtype === 'receive' && String(t.recipientId) === userId) ||
        (t.type === 'bank' && t.subtype === 'deposit' && String(t.userId) === userId)
      ) {
        return acc + Math.abs(t.amount || 0);
      }
      return acc;
    }, 0);

    // Calculate expenses (money sent)
    const expenses = filteredTransactions.reduce((acc, t) => {
      if (
        (t.type === 'transfer' && t.subtype === 'send' && String(t.userId) === userId) ||
        (t.type === 'bank' && t.subtype === 'withdrawal' && String(t.userId) === userId)
      ) {
        return acc + Math.abs(t.amount || 0);
      }
      return acc;
    }, 0);

    // Calculate 24h volume
    const last24Hours = new Date(now);
    last24Hours.setHours(now.getHours() - 24);
    const volume24h = filteredTransactions
      .filter(t => new Date(t.createdAt) >= last24Hours)
      .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

    // Count transactions
    const sentCount = filteredTransactions.filter(t => 
      t.subtype === 'send' && String(t.userId) === userId
    ).length;
    
    const receivedCount = filteredTransactions.filter(t => 
      t.subtype === 'receive' && String(t.recipientId) === userId
    ).length;

    // Update stats with real data only for verified users
    if (!showKycOverlay) {
      setStats({
        totalBalance: currentUser?.walletBalance || 0,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        volume24h: volume24h,
        transactions: {
          total: filteredTransactions.length,
          sent: sentCount,
          received: receivedCount
        }
      });
    }

    // Generate chart data with running balance
    const chartData = [];
    let chartBalance = balance;
    let day = new Date(startDate);
    while (day <= now) {
      const dayStr = day.toLocaleDateString();
      // Get transactions for this day
      const dayTxs = allSorted.filter(t => new Date(t.createdAt).toLocaleDateString() === dayStr);
      let dayIncome = 0, dayExpenses = 0;
      for (const t of dayTxs) {
        if (t.type === 'transfer') {
          if (t.subtype === 'send' && String(t.userId) === userId) {
            chartBalance -= Math.abs(t.amount);
            dayExpenses += Math.abs(t.amount);
          }
          if (t.subtype === 'receive' && String(t.recipientId) === userId) {
            chartBalance += Math.abs(t.amount);
            dayIncome += Math.abs(t.amount);
          }
        }
        if (t.type === 'bank') {
          if (t.subtype === 'deposit' && String(t.userId) === userId) {
            chartBalance += Math.abs(t.amount);
            dayIncome += Math.abs(t.amount);
          }
          if (t.subtype === 'withdrawal' && String(t.userId) === userId) {
            chartBalance -= Math.abs(t.amount);
            dayExpenses += Math.abs(t.amount);
          }
        }
      }
      chartData.push({
        name: day.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
        income: dayIncome,
        outcome: dayExpenses,
        balance: chartBalance
      });
      day.setDate(day.getDate() + 1);
    }
    setChartData(chartData);

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

  }, [transactions, currentUser, timeRange, t, i18n.language]);

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

  if (!loading && (!transactions || transactions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <motion.div 
            className={`w-32 h-32 rounded-full ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            } flex items-center justify-center mb-6 relative`}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <Wallet className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0)',
                  '0 0 0 10px rgba(59, 130, 246, 0.1)',
                  '0 0 0 0 rgba(59, 130, 246, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          <motion.h2 
            className="text-3xl font-bold text-center mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to Your Dashboard
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            You haven't made any transactions yet.<br />
            Start by making your first transfer!
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            onClick={handleRefresh}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-colors shadow-sm`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-5 h-5" />
            {t('dashboard.refreshData')}
          </motion.button>
          <motion.a
            href="/transfer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowUpRight className="w-5 h-5" />
            {t('dashboard.makeTransfer')}
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`p-6 rounded-2xl ${
            isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'
          } border max-w-lg backdrop-blur-sm`}
        >
          <motion.div 
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              className={`p-2 rounded-lg ${
                isDark ? 'bg-blue-800/50' : 'bg-blue-100'
              }`}
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <AlertCircle className={`w-6 h-6 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </motion.div>
            <div>
              <motion.h3 
                className="font-semibold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {t('dashboard.tip')}
              </motion.h3>
              <motion.p 
                className={`text-sm ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {t('dashboard.tipText')}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm cursor-pointer`}
              disabled={!!showKycOverlay}
            >
              <option value="7">{t('dashboard.last7Days')}</option>
              <option value="30">{t('dashboard.last30Days')}</option>
              <option value="90">{t('dashboard.last90Days')}</option>
            </select>
            <div className={`absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:bg-gray-800/50' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            } border rounded-xl p-8 transition-all duration-200 shadow-sm`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
              <span className={`flex items-center text-sm font-medium ${
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
            <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-2`}>
              {stat.title}
            </h3>
            <p className="text-3xl font-semibold">
              {showKycOverlay ? stat.value : (
                stat.title === t('dashboard.totalBalance') 
                  ? (currentUser?.walletBalance || 0).toFixed(2)
                  : stat.value
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                  dataKey="balance"
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
              {(() => {
                if (showKycOverlay) {
                  return mockTransactions.map((tx, index) => {
                    // ... existing mock transaction code ...
                  });
                } else {
                  const userId = String(currentUser?._id || currentUser?.id);
                  return transactions
                    .filter(tx => String(tx.userId) === userId || String(tx.recipientId) === userId)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map((tx, index) => {
                      let formattedType = '';
                      let formattedAmount = '';
                      if (tx.type === 'transfer') {
                        if (String(tx.userId) === userId) {
                          formattedType = `${t(`history.${tx.type}`)} - ${t('wallet.send')}`;
                          formattedAmount = `-${Math.abs(tx.amount)} ${tx.currency || 'TND'}`;
                        } else if (String(tx.recipientId) === userId) {
                          formattedType = `${t(`history.${tx.type}`)} - ${t('wallet.receive')}`;
                          formattedAmount = `+${Math.abs(tx.amount)} ${tx.currency || 'TND'}`;
                        }
                      } else if (tx.type === 'bank') {
                        formattedType = `${t(`history.${tx.type}`)} - ${t(`history.${tx.subtype}`)}`;
                        formattedAmount = `${tx.subtype === 'deposit' ? '+' : '-'}${Math.abs(tx.amount)} ${tx.currency || 'TND'}`;
                      }
                      const status = tx.status?.toLowerCase() || 'pending';
                      const formattedStatus = t(`status.${status}`);
                      const formattedDate = new Date(tx.createdAt).toLocaleString();
                      return (
                        <tr key={index} className={`border-b ${
                          isDark ? 'border-gray-800/50' : 'border-gray-200/50'
                        }`}>
                          <td className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'} py-4`}>{formattedType}</td>
                          <td className={`py-4 ${formattedAmount.startsWith('+') ? 'text-green-400' : 'text-red-400'} ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{formattedAmount}</td>
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
                    });
                }
              })()}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
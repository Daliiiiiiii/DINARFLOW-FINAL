import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  RefreshCw,
  Clock,
  LineChart,
  Info,
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';

const Crypto = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('exchange');
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const marketData = {
    priceChange24h: 5.2,
    marketCap: 1250000,
    volume24h: 450000,
    lastUpdated: new Date()
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-blue-900/20' : 'bg-blue-100'
            } flex items-center justify-center`}>
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Crypto Wallet</h1>
              <p className="text-gray-500 dark:text-gray-400">Buy, sell, and transfer DFLOW</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-2`}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => setShowInfo(true)}
              className={`px-4 py-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-2`}
            >
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl overflow-hidden shadow-lg`}
            >
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('exchange')}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                    activeTab === 'exchange'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Buy / Sell DFLOW
                  </div>
                  {activeTab === 'exchange' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
                    activeTab === 'transfer'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Transfer DFLOW
                  </div>
                  {activeTab === 'transfer' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'exchange' ? (
                    <motion.div
                      key="exchange"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          From
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                            } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                            placeholder="0.00"
                          />
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                            isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                          } px-2 py-1 rounded text-sm font-medium`}>
                            TND
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          To
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                            } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                            placeholder="0.00"
                            readOnly
                          />
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                            isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                          } px-2 py-1 rounded text-sm font-medium`}>
                            DFLOW
                          </div>
                        </div>
                      </div>
                      <div className={`${
                        isDark
                          ? 'bg-blue-900/20'
                          : 'bg-blue-50'
                      } p-4 rounded-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Exchange Rate</span>
                          <span className="text-sm font-medium">1 DFLOW = 0.25 TND</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Fee</span>
                          <span className="text-sm font-medium">0.5%</span>
                        </div>
                      </div>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Buy DFLOW
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="transfer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                              : 'border-gray-300 focus:border-blue-500'
                          } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                          placeholder="Enter DFLOW address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                                : 'border-gray-300 focus:border-blue-500'
                            } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                            placeholder="0.00"
                          />
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                            isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-100'
                          } px-2 py-1 rounded text-sm font-medium`}>
                            DFLOW
                          </div>
                        </div>
                      </div>
                      <div className={`${
                        isDark
                          ? 'bg-blue-900/20'
                          : 'bg-blue-50'
                      } p-4 rounded-lg flex items-start gap-3`}>
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Processing Time</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">Transfers typically complete within minutes</p>
                        </div>
                      </div>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Transfer DFLOW
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 shadow-lg relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">DFLOW Balance</h3>
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold mb-2">1,250.0000 DFLOW</p>
                <p className="text-gray-500 dark:text-gray-400">≈ 312.50 TND</p>
              </div>
            </motion.div>

            {/* Market Info */}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Market Overview</h3>
                <LineChart className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Current Rate</span>
                  <span className="font-medium">1 DFLOW = 0.25 TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">24h Change</span>
                  <span className="text-green-500 flex items-center gap-1">
                    +5.2%
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Market Cap</span>
                  <span className="font-medium">1,250,000 TND</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">24h Volume</span>
                  <span className="font-medium">450,000 TND</span>
                </div>
              </div>
            </motion.div>

            {/* Security Info */}
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
              <h3 className="text-lg font-semibold mb-4">Security Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${
                    isDark ? 'bg-green-900/20' : 'bg-green-100'
                  } flex items-center justify-center`}>
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Secure Transactions</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All crypto transactions are encrypted</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                  } flex items-center justify-center`}>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Processing Time</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Transactions complete within minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${
                    isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'
                  } flex items-center justify-center`}>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">Transaction Limits</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Daily limit: 10,000 TND</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setShowInfo(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className={`${
                  isDark 
                    ? 'bg-gray-900 border-gray-800' 
                    : 'bg-white border-gray-200'
                } border rounded-xl shadow-xl max-w-md w-full p-6`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">About DFLOW</h2>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    DFLOW is our native cryptocurrency designed for fast and secure transactions within our platform.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    The current exchange rate is fixed at 1 DFLOW = 0.25 TND, providing stability for users.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    All transactions are processed on our secure blockchain network, ensuring transparency and security.
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">Transaction Limits</h3>
                    <ul className="space-y-2">
                      <li className="text-gray-500 dark:text-gray-400">• Daily buy/sell limit: 10,000 TND</li>
                      <li className="text-gray-500 dark:text-gray-400">• Minimum transaction: 1 DFLOW</li>
                      <li className="text-gray-500 dark:text-gray-400">• Maximum transaction: 1,000 DFLOW</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Crypto;
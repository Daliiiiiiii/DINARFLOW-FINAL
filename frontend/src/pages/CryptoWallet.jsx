import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  QrCode,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  ChevronDown,
  Globe,
  Shield,
  Layers
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';

const networks = [
  { 
    id: 'ethereum', 
    name: 'Ethereum', 
    symbol: 'USDT', 
    icon: '⟠', 
    fee: '~$2.50', 
    time: '2-5 min',
    type: 'ERC20'
  },
  { 
    id: 'bsc', 
    name: 'BNB Chain', 
    symbol: 'USDT', 
    icon: '⛓️', 
    fee: '~$0.50', 
    time: '30 sec',
    type: 'BEP20'
  },
  { 
    id: 'tron', 
    name: 'TRON', 
    symbol: 'USDT', 
    icon: '🔷', 
    fee: '~$0.10', 
    time: '1 min',
    type: 'TRC20'
  },
  { 
    id: 'ton', 
    name: 'TON', 
    symbol: 'USDT', 
    icon: '💎', 
    fee: '~$0.05', 
    time: '5 sec',
    type: 'TON'
  },
  { 
    id: 'solana', 
    name: 'Solana', 
    symbol: 'USDT', 
    icon: '☀️', 
    fee: '~$0.01', 
    time: '1 sec',
    type: 'SPL'
  },
  { 
    id: 'polygon', 
    name: 'Polygon', 
    symbol: 'USDT', 
    icon: '⬡', 
    fee: '~$0.10', 
    time: '20 sec',
    type: 'MATIC'
  },
  { 
    id: 'arbitrum', 
    name: 'Arbitrum', 
    symbol: 'USDT', 
    icon: '🔷', 
    fee: '~$0.30', 
    time: '1 min',
    type: 'ARB'
  }
];

const CryptoWallet = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const isDark = theme === 'dark';
  const [showQR, setShowQR] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [showNetworks, setShowNetworks] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/wallet', { params: { userId: userProfile._id } });
      setWalletData(response.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWalletData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const handleSend = async () => {
    try {
      if (!sendAmount || !sendAddress) {
        toast.error('Please fill in all fields');
        return;
      }

      const response = await api.post('/api/wallet/send', {
        network: selectedNetwork.id,
        toAddress: sendAddress,
        amount: sendAmount
      });

      toast.success('Transaction sent successfully');
      setShowSend(false);
      setSendAmount('');
      setSendAddress('');
      fetchWalletData();
    } catch (error) {
      console.error('Error sending USDT:', error);
      toast.error(error.response?.data?.error || 'Failed to send USDT');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-gray-500">No wallet found</p>
        <button
          onClick={async () => {
            console.log('userProfile',  { userId: userProfile._id });
            try {
              await api.post('/api/wallet/create', { userId: userProfile._id });
              fetchWalletData();
            } catch (error) {
              toast.error('Failed to create wallet');
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Wallet
        </button>
      </div>
    );
  }

  const selectedNetworkData = walletData.networks.find(
    n => n.network === selectedNetwork.id
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-green-900/20' : 'bg-green-100'
            } flex items-center justify-center relative group`}>
              <Wallet className="w-6 h-6 text-green-500" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                $
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">USDT Wallet</h1>
              <div className="flex items-center gap-2">
                <p className="text-gray-500 dark:text-gray-400">Multi-Network Support</p>
                <div className={`px-2 py-0.5 rounded-full text-xs ${
                  isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {walletData.networks.length} Networks
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <a
              href={`https://etherscan.io/address/${walletData.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 relative overflow-hidden`}
            >
              {/* Animated Background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10" />
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-conic from-green-500/5 via-blue-500/5 to-green-500/5 blur-3xl opacity-50"
                />
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Balance</div>
                    <div className="text-3xl font-bold">
                      {selectedNetworkData?.balance || '0'} USDT
                    </div>
                    <div className="text-lg text-gray-500 dark:text-gray-400">
                      ≈ ${selectedNetworkData?.balance || '0'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-500">
                      <TrendingUp className="w-4 h-4" />
                      <span>+2.5%</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">24h Change</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSend(true)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 group"
                  >
                    <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                    Receive
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Network Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {networks.map((network, index) => {
                const networkData = walletData.networks.find(n => n.network === network.id);
                return (
                  <motion.button
                    key={network.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={() => setSelectedNetwork(network)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedNetwork.id === network.id
                        ? isDark
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-blue-50 border-blue-500'
                        : isDark
                          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{network.icon}</div>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {networkData?.balance || '0'} USDT
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Address Card */}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Wallet Address</h2>
                <button
                  onClick={() => handleCopy(selectedNetworkData?.address)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 break-all">
                {selectedNetworkData?.address}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Transactions */}
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
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {/* Add transaction history here */}
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No recent transactions
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      <AnimatePresence>
        {showSend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                isDark ? 'bg-gray-900' : 'bg-white'
              } rounded-xl p-6 w-full max-w-md`}
            >
              <h2 className="text-xl font-semibold mb-4">Send USDT</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USDT)</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    placeholder="0x..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSend(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                isDark ? 'bg-gray-900' : 'bg-white'
              } rounded-xl p-6 w-full max-w-md`}
            >
              <h2 className="text-xl font-semibold mb-4">Receive USDT</h2>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                  {/* Add QR code component here */}
                  <QrCode className="w-48 h-48" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedNetworkData?.address}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    />
                    <button
                      onClick={() => handleCopy(selectedNetworkData?.address)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CryptoWallet;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import PendingWallet from '../components/PendingWallet';
import FrozenWallet from '../components/FronzeWallet';

const networks = [
  { 
    id: 'ethereum', 
    name: 'Ethereum', 
    symbol: 'USDT', 
    icon: '⟠', 
    fee: '~$2.50', 
    time: '2-5 min',
    type: 'ERC20',
    chainId: 31337
  },
  { 
    id: 'bsc', 
    name: 'BNB Chain', 
    symbol: 'USDT', 
    icon: '⛓️', 
    fee: '~$0.50', 
    time: '30 sec',
    type: 'BEP20',
    chainId: 31338
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

// Memoized components for better rendering performance
const MemoizedHeader = React.memo(({ isDark, handleRefresh, isRefreshing, globalBalance }) => (
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
          <p className="text-gray-500 dark:text-gray-400">Global Balance: {globalBalance || '0'} USDT</p>
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
    </div>
  </div>
));

const MemoizedBalanceCard = React.memo(({ isDark, selectedNetworkData }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${
      isDark 
        ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
        : 'bg-white border-gray-200'
    } border rounded-xl p-6 relative overflow-hidden`}
  >
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
          {/* Trend data might be static or fetched separately */}
          <div className="flex items-center gap-2 text-green-500">
            <TrendingUp className="w-4 h-4" />
            <span>+2.5%</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">24h Change</div>
        </div>
      </div>

      {/* Send/Receive buttons moved to parent */}
    </div>
  </motion.div>
));

const MemoizedNetworkSelection = React.memo(({ networks, walletNetworksData, selectedNetworkId, onSelectNetwork, isDark }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      {networks.map((network, index) => {
        // Find the corresponding data in walletNetworksData
        const networkData = walletNetworksData.find(n => n.network === network.id);

        return (
          <motion.button
            key={network.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            onClick={() => onSelectNetwork(network)}
            className={`p-4 rounded-xl border transition-all ${
              selectedNetworkId === network.id
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
            {networkData?.isActive === false && (
              <div className="text-xs text-red-500 mt-1">Inactive</div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
));

// Add this new component for the copy animation
const CopyAnimation = ({ isCopied }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: isCopied ? 1 : 0,
      opacity: isCopied ? 1 : 0
    }}
    exit={{ scale: 0, opacity: 0 }}
    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm"
  >
    Copied!
  </motion.div>
);

// Update the MemoizedAddressCard component
const MemoizedAddressCard = React.memo(({ isDark, selectedNetworkData, handleCopy, handleViewOnExplorer }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(() => {
    handleCopy(selectedNetworkData?.address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  }, [handleCopy, selectedNetworkData?.address]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`${
        isDark 
          ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
          : 'bg-white border-gray-200'
      } border rounded-xl p-6 relative`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Wallet Address</h2>
        <div className="flex items-center gap-2">
          {/* View on Explorer button */}
          <button
            onClick={handleViewOnExplorer}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="View on Explorer"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          {/* Copy button with animation */}
          <div className="relative">
            <AnimatePresence>
              {isCopied && <CopyAnimation isCopied={isCopied} />}
            </AnimatePresence>
            <motion.button
              onClick={handleCopyClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Copy address"
              whileTap={{ scale: 0.95 }}
            >
              <Copy className={`w-5 h-5 ${isCopied ? 'text-green-500' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 break-all">
        {selectedNetworkData?.address || 'Loading address...'}
      </div>
    </motion.div>
  );
});

const MemoizedRecentTransactions = React.memo(({ isDark }) => (
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
));

const CryptoWallet = () => {
  // ** All Hooks must be defined here, unconditionally **
  const { theme } = useTheme();
  const { userProfile, setUserProfile } = useAuth();
  const isDark = theme === 'dark';

  const [showQR, setShowQR] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [showNetworks, setShowNetworks] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [globalBalance, setGlobalBalance] = useState('0');
  const [bridgeBalance, setBridgeBalance] = useState('0');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [showBridge, setShowBridge] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Find selected network data (derived state) - **DEFINE BEFORE CALLBACKS USING IT**
  const selectedNetworkData = useMemo(() => {
      return walletData?.networks?.find(
          n => n.network === selectedNetwork.id
      );
  }, [walletData?.networks, selectedNetwork.id]);

  // Define fetchWalletData using useCallback to ensure it's stable
  const fetchWalletData = useCallback(async (networkId = null) => {
    if (!userProfile || !userProfile._id) {
      console.log('fetchWalletData: userProfile not ready');
      return;
    }
    try {
      setIsLoading(true);
      const start = Date.now();
      console.log('Fetching wallet for network:', networkId);
      const response = await api.get('/api/wallet', { 
        params: { 
          userId: userProfile._id, 
          network: networkId,
          _t: lastRefresh
        } 
      });
      console.log('Wallet API response in', Date.now() - start, 'ms');
      const data = response.data;
      setWalletData(data);
      
      // Set global balance from fetched data
      if (data && data.globalUsdtBalance !== undefined) {
        setGlobalBalance(data.globalUsdtBalance);
      }

      // If a specific network was requested, select it
      if (networkId) {
        const network = networks.find(n => n.id === networkId);
        if (network) {
          setSelectedNetwork(network);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setWalletData(null);
        console.log('Wallet not found (404)');
      } else {
        console.error('Error fetching wallet data:', error);
        toast.error('Failed to load wallet data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, lastRefresh]);

  // Define useEffect for initial fetch and network changes
  useEffect(() => {
    console.log('useEffect: userProfile:', userProfile);
    console.log('useEffect: selectedNetwork.id:', selectedNetwork.id);
    // Fetch data whenever selectedNetwork.id or userProfile changes
    fetchWalletData(selectedNetwork.id);

  }, [selectedNetwork.id, userProfile, fetchWalletData]); // Dependencies for useEffect

  // Define other handlers using useCallback if they are passed to memoized children
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastRefresh(Date.now());
    await fetchWalletData(selectedNetwork.id);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [fetchWalletData, selectedNetwork.id]);

  const handleCopy = useCallback((text) => {
    if (!text) {
      toast.error('No address to copy');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  }, []);

  const handleSend = useCallback(async () => {
    if (!sendAmount || !sendAddress) {
        toast.error('Please fill in all fields');
        return;
    }

    try {
        console.log('Sending USDT with data:', {
            network: selectedNetwork.id,
            toAddress: sendAddress,
            amount: sendAmount
        });

        const response = await api.post('/api/wallet/send', {
            network: selectedNetwork.id,
            toAddress: sendAddress,
            amount: sendAmount
        });

        console.log('Send USDT response:', response.data);

        // Update wallet data with the response data
        if (response.data.wallet) {
            setWalletData(response.data.wallet);
            setGlobalBalance(response.data.newBalance);
            
            // Update user profile with new balances
            setUserProfile(prev => ({
                ...prev,
                wallet: {
                    ...prev.wallet,
                    globalUsdtBalance: response.data.newBalance
                }
            }));

            // Update network-specific balance in the UI
            if (response.data.wallet.networks) {
                const updatedNetwork = response.data.wallet.networks.find(n => n.network === selectedNetwork.id);
                if (updatedNetwork) {
                    setWalletData(prev => ({
                        ...prev,
                        networks: prev.networks.map(n => 
                            n.network === selectedNetwork.id ? updatedNetwork : n
                        )
                    }));
                }
            }
        }

        toast.success('Transaction sent successfully');
        setShowSend(false);
        setSendAmount('');
        setSendAddress('');
        
        // Force a refresh of the wallet data
        setLastRefresh(Date.now());
        await fetchWalletData(selectedNetwork.id);
    } catch (error) {
        console.error('Error sending USDT:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to send USDT';
        toast.error(errorMessage);
    }
  }, [selectedNetwork.id, sendAmount, sendAddress, fetchWalletData]);

  // Memoized callback for network selection button
  const onSelectNetwork = useCallback((network) => {
    setSelectedNetwork(network);
    // The useEffect will handle fetching when selectedNetwork changes
  }, [setSelectedNetwork]);

  // Memoized callback for viewing on explorer - **USES selectedNetworkData**
  const handleViewOnExplorer = useCallback(() => {
      if (!selectedNetworkData?.address) {
          toast.error('No address available to view on explorer');
          return;
      }
      // You might want to make this dynamic based on selectedNetwork.id
      const explorerUrl = `https://etherscan.io/address/${selectedNetworkData.address}`;
      // Add other networks here if needed, e.g., if (selectedNetwork.id === 'bsc') { ... }
      window.open(explorerUrl, '_blank');
  }, [selectedNetworkData?.address]); // Dependency on the address

  // Add bridge-related functions
  const handleBridge = useCallback(async () => {
    if (!bridgeAmount || !selectedNetwork || !userProfile?.wallet?.address) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsBridging(true);
      const response = await api.post('/api/bridge/process', {
        fromNetwork: selectedNetwork.id,
        amount: bridgeAmount,
        userAddress: userProfile.wallet.address
      });

      toast.success('Bridge request submitted successfully');
      setShowBridge(false);
      setBridgeAmount('');
      setLastRefresh(Date.now());
      await fetchWalletData(selectedNetwork.id);
      await fetchBridgeBalance();
    } catch (error) {
      console.error('Error bridging USDT:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to bridge USDT';
      toast.error(errorMessage);
    } finally {
      setIsBridging(false);
    }
  }, [bridgeAmount, selectedNetwork, userProfile?.wallet?.address, fetchWalletData]);

  // Add function to fetch bridge balance
  const fetchBridgeBalance = useCallback(async () => {
    if (!userProfile?.wallet?.address) return;
    
    try {
      const response = await api.get(`/api/bridge/balance/${userProfile.wallet.address}`);
      setBridgeBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching bridge balance:', error);
    }
  }, [userProfile?.wallet?.address]);

  // Update useEffect to fetch bridge balance
  useEffect(() => {
    if (userProfile?.wallet?.address) {
      fetchBridgeBalance();
    }
  }, [userProfile?.wallet?.address, fetchBridgeBalance]);

  // Add mintTestUSDT function
  const mintTestUSDT = useCallback(async () => {
    if (!selectedNetwork || !userProfile?._id) {
        toast.error('Please select a network first');
        return;
    }

    try {
        setIsMinting(true);
        const response = await api.post(`/api/wallet/mint-test/${userProfile._id}`, {
            network: selectedNetwork.id
        });

        toast.success('Test USDT minted successfully');
        setLastRefresh(Date.now());
        await fetchWalletData(selectedNetwork.id);
    } catch (error) {
        console.error('Error minting test USDT:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to mint test USDT';
        toast.error(errorMessage);
    } finally {
        setIsMinting(false);
    }
  }, [selectedNetwork, userProfile?._id, fetchWalletData]);

  // ** Conditional Renders based on state **
  if (!walletData) {
    return <PendingWallet />;
  }

  if (walletData.isFrozen) {
    return <FrozenWallet />;
  }

  // ** Render main UI (now using memoized components) **
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <MemoizedHeader 
          isDark={isDark} 
          handleRefresh={handleRefresh} 
          isRefreshing={isRefreshing}
          globalBalance={globalBalance}
        />

        <h2>Crypto Wallet</h2>

        {/* Display Global USDT Balance */}
        {userProfile?.wallet?.globalUsdtBalance !== undefined && (
            <div className="global-balance-display">
                <h3>Global USDT Balance: {userProfile.wallet.globalUsdtBalance}</h3>
            </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <MemoizedBalanceCard 
              isDark={isDark} 
              selectedNetworkData={selectedNetworkData} 
            />

            {/* Add Bridge Balance Display */}
            <div className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}>
              <h3 className="text-lg font-semibold mb-2">Bridge Balance</h3>
              <p className="text-2xl font-bold">{bridgeBalance} USDT</p>
            </div>

            {/* Send/Receive/Bridge buttons */}
            <div className="flex gap-3 px-6 sm:px-0">
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
              <button
                onClick={() => setShowBridge(true)}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 group"
              >
                <Layers className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Bridge
              </button>
              <button
                onClick={mintTestUSDT}
                disabled={isMinting}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isMinting ? 'animate-spin' : ''}`} />
                {isMinting ? 'Minting...' : 'Mint Test USDT'}
              </button>
            </div>

            {/* Network Selection */}
            <MemoizedNetworkSelection 
              networks={networks} 
              walletNetworksData={walletData.networks} 
              selectedNetworkId={selectedNetwork.id} 
              onSelectNetwork={onSelectNetwork} 
              isDark={isDark} 
            />

            {/* Address Card */}
            <MemoizedAddressCard 
                isDark={isDark} 
                selectedNetworkData={selectedNetworkData} 
                handleCopy={handleCopy} 
                handleViewOnExplorer={handleViewOnExplorer}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MemoizedRecentTransactions isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Modals (Send/QR) */}
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

      {/* Bridge Modal */}
      <AnimatePresence>
        {showBridge && (
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
              <h2 className="text-xl font-semibold mb-4">Bridge USDT</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (USDT)</label>
                  <input
                    type="number"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBridge(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBridge}
                    disabled={isBridging}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isBridging ? 'Bridging...' : 'Bridge'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CryptoWallet;
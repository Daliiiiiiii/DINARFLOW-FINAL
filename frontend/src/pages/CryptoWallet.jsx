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
import { QRCodeSVG } from 'qrcode.react';
import TransactionStatus from '../components/TransactionStatus';
import QRCodeModal from '../components/QRCodeModal';
import SendModal from '../components/SendModal';

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

const MemoizedBalanceCard = React.memo(({ isDark, globalBalance }) => (
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Global Balance</div>
          <div className="text-3xl font-bold">
            {globalBalance || '0'} USDT
          </div>
          <div className="text-lg text-gray-500 dark:text-gray-400">
            ≈ ${globalBalance || '0'}
          </div>
        </div>
      </div>
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

// Add MemoizedTransactionList component before CryptoWallet component
const MemoizedTransactionList = React.memo(({ transactions, isDark }) => {
  console.log('MemoizedTransactionList rendering with transactions:', transactions);

  if (!transactions || transactions.length === 0) {
    return (
      <div className={`p-6 rounded-xl border ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No transactions yet
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getNetworkName = (networkId) => {
    console.log('Attempting to get network name for ID:', networkId);
    const network = networks.find(n => n.id === networkId);
    const networkName = network ? network.name : 'Unknown Network';
    console.log('Resolved network name:', networkName);
    return networkName;
  };

  const getTransactionType = (tx) => {
    // Prioritize subtype if available
    if (tx.subtype) {
        return tx.subtype;
    } else if (tx.type === 'crypto' || tx.type === 'crypto_transfer') {
        // If type is crypto/crypto_transfer and no subtype, infer from amount sign
        return tx.amount < 0 ? 'send' : 'receive';
    }
    // Fallback for unexpected structures - assume 'send' if amount is negative
    return tx.amount < 0 ? 'send' : 'receive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl border ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
      </div>
      <div className="space-y-4">
        {transactions.map((tx) => {
          const txType = getTransactionType(tx);
          return (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
              } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txType === 'send' 
                      ? isDark ? 'bg-red-900/20' : 'bg-red-100'
                      : isDark ? 'bg-green-900/20' : 'bg-green-100'
                  }`}>
                    {txType === 'send' ? (
                      <ArrowUpRight className={`w-5 h-5 ${
                        isDark ? 'text-red-400' : 'text-red-500'
                      }`} />
                    ) : (
                      <ArrowDownRight className={`w-5 h-5 ${
                        isDark ? 'text-green-400' : 'text-green-500'
                      }`} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {txType === 'send' ? 'Sent' : 'Received'} USDT
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.createdAt || tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    txType === 'send' 
                      ? isDark ? 'text-red-400' : 'text-red-500'
                      : isDark ? 'text-green-400' : 'text-green-500'
                  }`}>
                    {txType === 'send' ? '-' : '+'}{Math.abs(tx.amount)} USDT
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getNetworkName(tx.network)}
                  </div>
                </div>
              </div>
              {tx.status && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {tx.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : tx.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="capitalize">{tx.status}</span>
                </div>
              )}
              {tx.hash && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                  TX Hash: {tx.hash}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

// Add a function to validate network addresses
const validateNetworkAddress = (address, networkId) => {
  const network = networks.find(n => n.id === networkId);
  if (!network) return false;

  switch (networkId) {
    case 'ethereum':
    case 'arbitrum':
    case 'polygon':
      // Ethereum, Arbitrum, and Polygon addresses start with 0x and are 42 characters long
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'bsc':
      // BSC addresses are similar to Ethereum
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'tron':
      // TRON addresses start with T and are 34 characters long
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    case 'solana':
      // Solana addresses are base58 encoded and 32-44 characters long
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    case 'ton':
      // TON addresses are base64 encoded and start with UQ
      return /^UQ[a-zA-Z0-9_-]{48}$/.test(address);
    default:
      return false;
  }
};

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
  const [isMinting, setIsMinting] = useState(false);
  const [cryptoTransactions, setCryptoTransactions] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionMessage, setTransactionMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Find selected network data (derived state) - **DEFINE BEFORE CALLBACKS USING IT**
  const selectedNetworkData = useMemo(() => {
      return walletData?.networks?.find(
          n => n.network === selectedNetwork.id
      );
  }, [walletData?.networks, selectedNetwork.id]);

  // Add check for superadmin role
  const isSuperAdmin = useMemo(() => {
    return userProfile?.role === 'superadmin';
  }, [userProfile?.role]);

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
        // Also update user profile's wallet balance
        console.log('Attempting to update userProfile with new balance. setUserProfile is:', setUserProfile);
        if (typeof setUserProfile === 'function') {
          setUserProfile(prev => {
            if (!prev) return null;
            return {
              ...prev,
              wallet: {
                ...prev.wallet,
                globalUsdtBalance: data.globalUsdtBalance
              }
            };
          });
        } else {
          console.warn('setUserProfile is not available. Skipping user profile update.');
        }
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
  }, [userProfile, lastRefresh, setUserProfile]);

  // Add function to fetch crypto transactions
  const fetchCryptoTransactions = useCallback(async () => {
    if (!userProfile || !userProfile._id) {
      console.log('fetchCryptoTransactions: userProfile not ready');
      return;
    }
    try {
      console.log('Fetching crypto transactions...');
      const response = await api.get('/api/transactions', {
        params: {
          userId: userProfile._id,
          type: 'crypto', // Filter by crypto transactions
          _t: lastRefresh // Use lastRefresh to help cache bust if needed
        }
      });
      console.log('Crypto transactions fetched successfully.', response.data.transactions);
      // Log the first few transactions to inspect their structure
      if (response.data.transactions && response.data.transactions.length > 0) {
        console.log('First 3 raw crypto transactions from API:', response.data.transactions.slice(0, 3));
      }
      setCryptoTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching crypto transactions:', error);
      // Optionally display a toast error
      // toast.error('Failed to load transactions');
    }
  }, [userProfile, lastRefresh]);

  // Update useEffect to fetch crypto transactions as well
  useEffect(() => {
    console.log('useEffect: userProfile:', userProfile);
    if (userProfile?._id) {
      fetchWalletData();
      fetchCryptoTransactions(); // Fetch crypto transactions
    }
  }, [userProfile, fetchWalletData, fetchCryptoTransactions]); // Add fetchCryptoTransactions to dependencies

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
    setIsCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  }, []);

  const handleSend = useCallback(async () => {
    if (!sendAmount || !sendAddress) {
        toast.error('Please fill in all fields');
        return;
    }

    // Validate the recipient address format for the selected network
    if (!validateNetworkAddress(sendAddress, selectedNetwork.id)) {
        const errorMsg = `Invalid ${selectedNetwork.name} address format. Please check the address and try again.`;
        setTransactionStatus('error');
        setTransactionMessage(errorMsg);
        toast.error(errorMsg);
        return;
    }

    try {
        setIsSending(true);
        setTransactionStatus('loading');
        setTransactionMessage('Initiating transaction...');
        
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
            
            if (typeof setUserProfile === 'function') {
                setUserProfile(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        wallet: {
                            ...prev.wallet,
                            globalUsdtBalance: response.data.newBalance
                        }
                    };
                });
            }
        }

        setTransactionStatus('success');
        setTransactionMessage('Transaction completed successfully');
        toast.success('Transaction sent successfully');
        
        // Close the send modal and reset form after a delay
        setTimeout(() => {
            setShowSend(false);
            setSendAmount('');
            setSendAddress('');
            setTransactionStatus(null);
            setTransactionMessage('');
            setIsSending(false);
            
            setLastRefresh(Date.now());
            fetchCryptoTransactions();
        }, 2000);

    } catch (error) {
        console.error('Error sending USDT:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to send USDT';
        setTransactionStatus('error');
        setTransactionMessage(errorMessage);
        toast.error(errorMessage);
        
        setTimeout(() => {
            setTransactionStatus(null);
            setTransactionMessage('');
            setIsSending(false);
        }, 2000);
    }
  }, [selectedNetwork.id, sendAmount, sendAddress, fetchCryptoTransactions, setUserProfile]);

  // Update the network selection handler to not trigger a fetch
  const onSelectNetwork = useCallback((network) => {
    setSelectedNetwork(network);
    // Don't fetch wallet data here anymore
  }, []);

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
        // fetchWalletData(); // useEffect will handle this via lastRefresh
        fetchCryptoTransactions(); // Refresh transactions
    } catch (error) {
        console.error('Error minting test USDT:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to mint test USDT';
        toast.error(errorMessage);
    } finally {
        setIsMinting(false);
    }
  }, [selectedNetwork, userProfile?._id, fetchCryptoTransactions]); // Add fetchCryptoTransactions to dependencies

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`w-14 h-14 rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-lg flex items-center justify-center relative group`}
            >
              <Wallet className="w-7 h-7 text-blue-500" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold shadow-lg"
              >
                $
              </motion.div>
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
              >
                USDT Wallet
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400"
              >
                Global Balance: {globalBalance} USDT
              </motion.p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className={`p-3 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-lg hover:shadow-xl transition-all`}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark ? 'bg-gray-800/50' : 'bg-white'
              } rounded-2xl p-8 relative overflow-hidden backdrop-blur-xl border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } shadow-xl`}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-conic from-blue-500/5 via-purple-500/5 to-blue-500/5 blur-3xl opacity-50"
                />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Balance</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {globalBalance} USDT
                    </div>
                    <div className="text-lg text-gray-500 dark:text-gray-400">
                      ≈ ${globalBalance}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSendModal(true)}
                className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowQR(true)}
                className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Receive
              </motion.button>
              {isSuperAdmin && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={mintTestUSDT}
                  disabled={isMinting}
                  className="p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${isMinting ? 'animate-spin' : ''}`} />
                  {isMinting ? 'Minting...' : 'Mint Test USDT'}
                </motion.button>
              )}
            </motion.div>

            {/* Network Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {networks.map((network, index) => {
                const networkData = walletData?.networks?.find(n => n.network === network.id);
                return (
                  <motion.button
                    key={network.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={() => onSelectNetwork(network)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedNetwork.id === network.id
                        ? isDark
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-blue-50 border-blue-500'
                        : isDark
                          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    } shadow-lg hover:shadow-xl`}
                  >
                    <div className="text-2xl mb-2">{network.icon}</div>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Fee: {network.fee}
                    </div>
                    {networkData?.isActive === false && (
                      <div className="text-xs text-red-500 mt-1">Inactive</div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Address Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`${
                isDark ? 'bg-gray-800/50' : 'bg-white'
              } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              } shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Wallet Address</h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleViewOnExplorer}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(selectedNetworkData?.address)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isCopied 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-500' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Copy address"
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isCopied ? 360 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isCopied ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </motion.div>
                  </motion.button>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 break-all font-mono text-sm">
                {selectedNetworkData?.address || 'Loading address...'}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`${
              isDark ? 'bg-gray-800/50' : 'bg-white'
            } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            } shadow-xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
            <div className="space-y-4">
              {cryptoTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No transactions yet
                </div>
              ) : (
                cryptoTransactions.map((tx, index) => {
                  const txType = tx.amount < 0 ? 'send' : 'receive';
                  return (
                    <motion.div
                      key={tx._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            txType === 'send' 
                              ? isDark ? 'bg-red-900/20' : 'bg-red-100'
                              : isDark ? 'bg-green-900/20' : 'bg-green-100'
                          }`}>
                            {txType === 'send' ? (
                              <ArrowUpRight className={`w-5 h-5 ${
                                isDark ? 'text-red-400' : 'text-red-500'
                              }`} />
                            ) : (
                              <ArrowDownRight className={`w-5 h-5 ${
                                isDark ? 'text-green-400' : 'text-green-500'
                              }`} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {txType === 'send' ? 'Sent' : 'Received'} USDT
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(tx.createdAt || tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            txType === 'send' 
                              ? isDark ? 'text-red-400' : 'text-red-500'
                              : isDark ? 'text-green-400' : 'text-green-500'
                          }`}>
                            {txType === 'send' ? '-' : '+'}{Math.abs(tx.amount)} USDT
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {networks.find(n => n.id === tx.network)?.name || 'Unknown Network'}
                          </div>
                        </div>
                      </div>
                      {tx.status && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          {tx.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : tx.status === 'pending' ? (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="capitalize">{tx.status}</span>
                        </div>
                      )}
                      {tx.hash && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                          TX Hash: {tx.hash}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSendModal && (
          <SendModal
            isDark={isDark}
            selectedNetwork={selectedNetwork}
            sendAmount={sendAmount}
            setSendAmount={setSendAmount}
            sendAddress={sendAddress}
            setSendAddress={setSendAddress}
            handleSend={handleSend}
            onClose={() => setShowSendModal(false)}
            isSending={isSending}
            transactionStatus={transactionStatus}
            transactionMessage={transactionMessage}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <QRCodeModal
            isDark={isDark}
            selectedNetworkData={selectedNetworkData}
            handleCopy={handleCopy}
            onClose={() => setShowQR(false)}
          />
        )}
      </AnimatePresence>

      <TransactionStatus 
        show={!!transactionStatus} 
        type={transactionStatus}
        message={transactionMessage}
      />
    </>
  );
};

export default CryptoWallet;
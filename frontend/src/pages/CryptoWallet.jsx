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
import { ethers } from 'ethers';

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
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 break-all">
        {selectedNetworkData?.address || 'Loading address...'}
      </div>
    </motion.div>
  );
});

// Add utility functions before MemoizedTransactionList
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
  console.log('=== Network Name Resolution ===');
  console.log('Input network ID:', networkId);
  
  // If no network ID is provided, try to determine from the transaction context
  if (!networkId) {
    console.log('No network ID provided, checking transaction context');
    // Default to the currently selected network
    const defaultNetwork = networks[0];
    console.log('Using default network:', defaultNetwork.name);
    return defaultNetwork.name;
  }
  
  const network = networks.find(n => n.id === networkId);
  const networkName = network ? network.name : 'Unknown Network';
  console.log('Resolved network:', {
    inputId: networkId,
    found: !!network,
    name: networkName
  });
  return networkName;
};

const getTransactionType = (tx, selectedNetworkData, currentUserId) => {
  // First check if we have a subtype
  if (tx.subtype) {
    return tx.subtype;
  }

  // First try to determine user's role using from/to addresses
  const userAddress = selectedNetworkData?.address?.toLowerCase();
  const fromAddress = tx.from?.toLowerCase();
  const toAddress = tx.to?.toLowerCase();

  // If we have from/to addresses, use them to determine the type
  if (fromAddress && toAddress) {
    if (userAddress === fromAddress) {
      return 'send';
    } else if (userAddress === toAddress) {
      return 'receive';
    }
  }

  // If we have userId, use it to determine if the current user is the sender
  if (tx.userId && currentUserId) {
    const isSender = tx.userId === currentUserId;
    
    // For received transactions, we need to check if this is a duplicate
    if (!isSender && tx.amount > 0) {
      return 'receive';
    }
    
    // For sent transactions
    return isSender ? 'send' : 'receive';
  }

  // If we don't have userId or addresses, use the amount sign
  return tx.amount < 0 ? 'send' : 'receive';
};

const MemoizedTransactionList = React.memo(({ transactions, isDark, selectedNetworkData, currentUserId }) => {
  console.log('=== Transaction List Processing ===');
  console.log('Selected Network Data:', selectedNetworkData);

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

  // First, sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.timestamp);
    const dateB = new Date(b.createdAt || b.timestamp);
    return dateB - dateA;
  });

  // Create a Set to track seen transaction keys
  const seenKeys = new Set();
  
  // Filter out duplicates
  const uniqueTransactions = sortedTransactions.filter(tx => {
    // Create a unique key for this transaction
    const key = JSON.stringify({
      amount: tx.amount,
      createdAt: tx.createdAt || tx.timestamp,
      type: tx.type,
      network: tx.network || selectedNetworkData?.network, // Use selected network if tx.network is undefined
      userId: tx.userId
    });

    // If we've seen this key before, it's a duplicate
    if (seenKeys.has(key)) {
      return false;
    }

    // Add this key to our seen set
    seenKeys.add(key);
    return true;
  });

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
        {uniqueTransactions.map((tx, index) => {
          const txType = getTransactionType(tx, selectedNetworkData, currentUserId);
          const networkId = tx.network || selectedNetworkData?.network;
          
          console.log('Rendering transaction:', {
            id: tx._id,
            amount: tx.amount,
            type: txType,
            network: networkId,
            selectedNetwork: selectedNetworkData?.network,
            createdAt: tx.createdAt,
            index
          });

          return (
            <motion.div
              key={`${tx._id}-${tx.createdAt}-${tx.amount}`}
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
                    {getNetworkName(networkId)}
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

// Add these utility functions before validateNetworkAddress
const isValidEthereumChecksum = (address) => {
  try {
    // Remove 0x prefix
    const addressWithoutPrefix = address.slice(2);
    
    // Convert to lowercase for comparison
    const addressLower = addressWithoutPrefix.toLowerCase();
    
    // Calculate checksum using ethers v6 syntax
    const hash = ethers.keccak256(ethers.toUtf8Bytes(addressLower)).slice(2);
    
    // Check each character
    for (let i = 0; i < 40; i++) {
      // If the hash byte is 1, the address character should be uppercase
      if ((parseInt(hash[i], 16) > 7 && addressWithoutPrefix[i].toUpperCase() !== addressWithoutPrefix[i]) ||
          (parseInt(hash[i], 16) <= 7 && addressWithoutPrefix[i].toLowerCase() !== addressWithoutPrefix[i])) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error validating Ethereum checksum:', error);
    return false;
  }
};

const detectNetworkFromAddress = (address) => {
  if (!address) return null;
  
  // Check for Ethereum-style addresses (0x prefix)
  if (address.startsWith('0x')) {
    // Basic format check
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
    
    // Try to validate checksum
    if (isValidEthereumChecksum(address)) {
      return 'ethereum';
    }
    
    // If checksum fails but format is correct, it might be BSC or Polygon
    // We'll need to check the chain ID or other network-specific properties
    return 'unknown_evm';
  }
  
  // Check for TRON addresses
  if (address.startsWith('T') && /^T[a-zA-Z0-9]{33}$/.test(address)) {
    return 'tron';
  }
  
  // Check for Solana addresses
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }
  
  // Check for TON addresses
  if ((address.startsWith('EQ') || address.startsWith('UQ')) && 
      address.length === 48 && 
      /^[a-zA-Z0-9_-]{46}$/.test(address.slice(2))) {
    return 'ton';
  }
  
  return null;
};

// Update the validateNetworkAddress function
const validateNetworkAddress = (address, network) => {
    if (!address) return { isValid: false, message: 'Address is required' };

    // Check if it's a cross-network address
    const isCrossNetwork = isCrossNetworkAddress(address, network);
    if (isCrossNetwork) {
        return {
            isValid: false,
            message: 'Cross-network address detected',
            isCrossNetwork: true,
            details: {
                address,
                network,
                detectedNetwork: detectNetworkFromAddress(address)
            }
        };
    }

    // Rest of the validation logic
    switch (network) {
        case 'ethereum':
        case 'bsc':
        case 'polygon':
        case 'arbitrum':
            if (!ethers.isAddress(address)) {
                return { isValid: false, message: 'Invalid EVM address format' };
            }
            break;
        case 'ton':
            if (!address.startsWith('EQ') && !address.startsWith('UQ')) {
                return { isValid: false, message: 'TON addresses must start with EQ or UQ' };
            }
            if (address.length !== 48) {
                return { isValid: false, message: 'TON addresses must be 48 characters long' };
            }
            if (!/^[a-zA-Z0-9_-]{46}$/.test(address.slice(2))) {
                return { isValid: false, message: 'TON addresses contain invalid characters' };
            }
            break;
        case 'tron':
            if (!address.match(/^T[A-Za-z1-9]{33}$/)) {
                return { isValid: false, message: 'Invalid TRON address format' };
            }
            break;
        case 'solana':
            if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                return { isValid: false, message: 'Invalid Solana address format' };
            }
            break;
    }

    return { isValid: true };
};

// Update the CrossNetworkWarning component
const CrossNetworkWarning = ({ details, onClose, onProceed }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    const handleProceed = () => {
        if (!isVerified) {
            toast.error('Please verify that you understand the risks');
            return;
        }
        if (typeof onProceed === 'function') {
            setIsAnimating(true);
            setTimeout(() => {
                setIsVisible(false);
                onProceed();
            }, 300);
        } else {
            console.error('onProceed is not a function');
            toast.error('An error occurred. Please try again.');
        }
    };

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 overflow-hidden"
            >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-yellow-500/5 to-orange-500/5" />
                
                {/* Content */}
                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                                Cross-Network Warning
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Network Info */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">From Network</span>
                                <span className="font-medium text-gray-900 dark:text-white">{details.network}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-gray-600" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">To Network</span>
                                <span className="font-medium text-red-500">{details.detectedNetwork}</span>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Address</div>
                            <div className="font-mono text-sm bg-white dark:bg-gray-800 rounded-lg p-2 break-all">
                                {details.address}
                            </div>
                        </div>

                        {/* Warning Message */}
                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            This address appears to be from a different network. Cross-network transfers may result in permanent loss of funds. Please verify the address and network before proceeding.
                        </div>

                        {/* Verification Checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                            <div className="pt-0.5">
                                <input
                                    type="checkbox"
                                    id="verify-risk"
                                    checked={isVerified}
                                    onChange={(e) => setIsVerified(e.target.checked)}
                                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                />
                            </div>
                            <label htmlFor="verify-risk" className="text-sm text-gray-700 dark:text-gray-300">
                                I understand that sending funds to an address on a different network may result in permanent loss of funds, and I take full responsibility for any potential losses.
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProceed}
                                disabled={!isVerified}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                                    isVerified 
                                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Proceed Anyway
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Add this function before the CryptoWallet component
const getNetworkWarningMessage = (address, selectedNetworkId) => {
    const detectedNetwork = detectNetworkFromAddress(address);
    if (!detectedNetwork || detectedNetwork === selectedNetworkId) return null;
    
    const selectedNetwork = networks.find(n => n.id === selectedNetworkId);
    const detectedNetworkInfo = networks.find(n => n.id === detectedNetwork);
    
    if (!selectedNetwork || !detectedNetworkInfo) return null;
    
    return {
        address,
        network: selectedNetwork.name,
        detectedNetwork: detectedNetworkInfo.name
    };
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
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [crossNetworkWarning, setCrossNetworkWarning] = useState(null);
  const [lastTransactionHash, setLastTransactionHash] = useState(null);

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
        
        // Only update user profile if the balance has actually changed
        if (userProfile.wallet?.globalUsdtBalance !== data.globalUsdtBalance) {
          console.log('Updating user profile with new balance:', data.globalUsdtBalance);
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
      console.log('Crypto transactions fetched successfully. Data:', response.data);
      // Log the first few transactions to inspect their structure
      if (response.data.transactions && response.data.transactions.length > 0) {
        console.log('First 3 raw crypto transactions from API:', response.data.transactions.slice(0, 3));
      }
      setCryptoTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching crypto transactions:', error);
      // Optionally display a toast error
      toast.error('Failed to load transactions');
    }
  }, [userProfile, lastRefresh]);

  // Update useEffect to prevent unnecessary fetches
  useEffect(() => {
    if (userProfile?._id && !isLoading) {
      fetchWalletData();
      fetchCryptoTransactions();
    }
  }, [userProfile?._id, lastRefresh]); // Only depend on userProfile._id and lastRefresh

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

  const handleSend = useCallback(async (e) => {
    // Prevent default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!sendAmount || !sendAddress) {
        toast.error('Please fill in all fields');
        return;
    }

    // Prevent multiple submissions with more robust checks
    if (isSending || currentTransactionId) {
        toast.error('Transaction already in progress');
        return;
    }

    // Check for network mismatch warning BEFORE any balance checks or API calls
    const networkWarning = getNetworkWarningMessage(sendAddress, selectedNetwork.id);
    if (networkWarning) {
        setCrossNetworkWarning({
            ...networkWarning,
            // If the user proceeds despite the warning, then initiate the send
            onProceed: async () => {
                // Reset warning state
                setCrossNetworkWarning(null);
                // Proceed with the actual send logic
                await initiateSend();
            }
        });
        // Stop the current handleSend execution here, wait for user decision on warning
        return;
    }

    // If no cross-network warning, proceed directly with sending
    await initiateSend();

}, [sendAmount, sendAddress, selectedNetwork, isSending, currentTransactionId, fetchWalletData, fetchCryptoTransactions]);

// Create a new helper function to contain the core send logic
const initiateSend = useCallback(async () => {
    // Generate a unique transaction ID
    const txId = Date.now().toString();
    setCurrentTransactionId(txId);

    try {
        setIsSending(true);
        setTransactionStatus('loading');
        setTransactionMessage('Initiating transaction...');
        
        console.log('Sending USDT with data:', {
            network: selectedNetwork.id,
            toAddress: sendAddress,
            amount: sendAmount,
            transactionId: txId
        });

        const response = await api.post('/api/wallet/send', {
            network: selectedNetwork.id,
            toAddress: sendAddress,
            amount: sendAmount,
            transactionId: txId
        });

        if (!response.data) {
            throw new Error('No response data received');
        }

        console.log('Send USDT response:', response.data);

        if (response.data.wallet) {
            setWalletData(response.data.wallet);
            setGlobalBalance(response.data.newBalance);
        }

        setTransactionStatus('success');
        setTransactionMessage('Transaction completed successfully');
        toast.success('Transaction completed successfully');
        
        // Close the send modal after 3 seconds
        setTimeout(() => {
            setShowSendModal(false);
            setSendAmount('');
            setSendAddress('');
            setTransactionStatus(null);
            setTransactionMessage('');
            // Clear the last transaction hash after the modal closes
            setLastTransactionHash(null);
        }, 3000);
        
        // Refresh data without page reload
        await fetchWalletData(selectedNetwork.id);
        await fetchCryptoTransactions();
        
        // Capture the transaction hash from the response if available
        if (response.data?.transaction?.hash) {
            setLastTransactionHash(response.data.transaction.hash);
            console.log('Captured transaction hash:', response.data.transaction.hash);
        }

    } catch (error) {
        console.error('Error sending USDT:', error);
        // Log the full error object to inspect its structure
        console.log('Full error object:', JSON.stringify(error, null, 2));
        setTransactionStatus('error');
        // Access the error message from error.response?.data?.error
        setTransactionMessage(error.response?.data?.error || 'Failed to send USDT');
        toast.error(error.response?.data?.error || 'Failed to send USDT');
    } finally {
        setIsSending(false);
        setCurrentTransactionId(null);
    }

}, [sendAmount, sendAddress, selectedNetwork, fetchWalletData, fetchCryptoTransactions]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      setCurrentTransactionId(null);
      setIsSending(false);
      setTransactionStatus(null);
      setTransactionMessage('');
    };
  }, []);

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
                <MemoizedTransactionList
                  transactions={cryptoTransactions}
                  isDark={isDark}
                  selectedNetworkData={selectedNetworkData}
                  currentUserId={userProfile?._id}
                />
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
        transactionHash={lastTransactionHash}
        onClose={() => {
          if (transactionStatus === 'success') {
            setShowSendModal(false);
            setSendAmount('');
            setSendAddress('');
          }
          setTransactionStatus(null);
          setTransactionMessage('');
          setIsSending(false);
          setCurrentTransactionId(null);
        }}
      />

      {crossNetworkWarning && (
        <CrossNetworkWarning
            details={crossNetworkWarning}
            onClose={() => setCrossNetworkWarning(null)}
            onProceed={crossNetworkWarning.onProceed}
        />
      )}
    </>
  );
};

export default CryptoWallet;
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { useTheme } from '../contexts/ThemeContext';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet as WalletIcon, 
  CreditCard, 
  QrCode, 
  Building2, 
  ArrowLeftRight,
  ShoppingCart,
  Gift,
  Banknote,
  Receipt
} from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import KYCOverlay from '../layouts/KYCOverlay';
import CreditCardInput from '../components/CreditCardInput';
import ActionAnimation from '../components/ActionAnimation';
import api from '../lib/axios';
import ComingSoonOverlay from '../components/ui/ComingSoonOverlay';

const Wallet = () => {
  const { theme } = useTheme();
  const { transactions, fetchTransactions, loading } = useTransactions();
  const { userProfile, updateWalletBalance } = useAuth();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [bankAccount, setBankAccount] = useState(null);
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  const [isCreditCardOpen, setIsCreditCardOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState('processing');
  const [isQrScanOpen, setIsQrScanOpen] = useState(false);

  // Show KYCOverlay if user is not verified
  const showKycOverlay = userProfile && userProfile.kyc?.status !== 'verified';
  const kycStatus = userProfile?.kyc?.status || 'unverified';
  const rejectionReason = userProfile?.kyc?.verificationNotes || '';

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const walletBalance = userProfile.walletBalance || 0;

  const wallets = [
    {
      name: t('wallet.title'),
      balance: walletBalance,
      currency: 'TND',
      icon: WalletIcon
    },
    {
      name: t('wallet.bankAccount'),
      balance: userProfile.bankBalance,
      currency: 'TND',
      icon: Building2
    }
  ];

  useEffect(() => {
    const fetchBankAccount = async () => {
      if (userProfile?.associatedBankAccount && (typeof userProfile.associatedBankAccount === 'string' || typeof userProfile.associatedBankAccount === 'number')) {
        setBankAccountLoading(true);
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.get(`/api/bank-accounts/${userProfile.associatedBankAccount}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBankAccount(data.bankAccount);
        } catch (e) {
          setBankAccount(null);
        } finally {
          setBankAccountLoading(false);
        }
      }
    };
    fetchBankAccount();
  }, [userProfile]);

  const handleCreditCardSubmit = async (cardData) => {
    setShowAnimation(true);
    setAnimationType('processing');
    
    try {
      // Make API call to process the payment and top up wallet
      const response = await api.post('/api/wallet/topup', {
        amount: cardData.amount,
        cardDetails: {
          number: cardData.number,
          name: cardData.name,
          expiry: cardData.expiry,
          cvv: cardData.cvv
        }
      });
      
      // Update local state with new balance
      if (response.data && response.data.newBalance) {
        updateWalletBalance(response.data.newBalance);
      }
      
      setAnimationType('success');
      setTimeout(() => {
        setShowAnimation(false);
        setIsCreditCardOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Top-up failed:', error);
      setAnimationType('error');
      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
  };

  const getTransactionIcon = (type, isPositive, metadata, subtype) => {
    switch (type?.toLowerCase()) {
      case 'transfer':
        if (metadata?.bankAccountId) {
          return <Building2 className="w-5 h-5" />;
        }
        if (subtype === 'send') {
          return <ArrowUpRight className="w-5 h-5" />;
        }
        if (subtype === 'receive') {
          return <ArrowDownRight className="w-5 h-5" />;
        }
        return <ArrowLeftRight className="w-5 h-5" />;
      case 'payment':
        return <ShoppingCart className="w-5 h-5" />;
      case 'deposit':
        return <Banknote className="w-5 h-5" />;
      case 'withdrawal':
        return <Receipt className="w-5 h-5" />;
      case 'refund':
        return <Gift className="w-5 h-5" />;
      default:
        return isPositive ? 
          <ArrowUpRight className="w-5 h-5" /> : 
          <ArrowDownRight className="w-5 h-5" />;
    }
  };

  const getTransactionType = (type, metadata) => {
    if (type?.toLowerCase() === 'transfer' && metadata?.bankAccountId) {
      return 'Bank Transfer';
    }
    if (type?.toLowerCase() === 'transfer' && metadata?.cardDetails) {
      return 'Card Top Up';
    }
    return type;
  };

  const formatDate = (dateString) => {
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // Try parsing ISO string
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else if (dateString?.toDate) {
        // Handle Firestore Timestamp
        date = dateString.toDate();
      } else {
        return 'Invalid date';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Format the date according to user's locale
      return new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div>
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}
      <h1 className="text-2xl font-bold mb-6">{t('wallet.title')}</h1>
      <div className="space-y-8">
        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.name}
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
                  <wallet.icon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>
                {wallet.name}
              </h3>
              <p className="text-3xl font-semibold mb-6">
                {wallet.currency} {wallet.balance?.toFixed(2) || '0.00'}
              </p>
            </motion.div>
          ))}

          {/* Animated Double Arrow */}
          <Link 
            to="/transfer"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`p-4 rounded-full ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100'
              } border border-gray-700 shadow-lg cursor-pointer group`}
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                animate={{ x: [-3, 3, -3] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ArrowLeftRight className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
              </motion.div>
            </motion.div>
          </Link>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h3 className="text-xl font-semibold mb-6">{t('wallet.quickActions')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setIsCreditCardOpen(true)}
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <CreditCard className="w-5 h-5 text-blue-400" />
              {t('wallet.addMoney')}
            </button>
            <button 
              onClick={() => setIsQrScanOpen(true)}
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <QrCode className="w-5 h-5 text-blue-400" />
              {t('wallet.scanQr')}
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
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
          <h3 className="text-xl font-semibold mb-6">{t('wallet.recentActivity')}</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('wallet.noTransactions')}
              </p>
            ) : (
              transactions
                .filter(activity => !activity.type?.toLowerCase().includes('crypto'))
                .slice(0, 6)
                .map((activity, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.amount > 0 
                          ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') 
                          : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                      }`}>
                        {getTransactionIcon(activity.type, activity.amount > 0, activity.metadata, activity.subtype)}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          activity.amount > 0 
                            ? (isDark ? 'text-green-400' : 'text-green-600') 
                            : (isDark ? 'text-red-400' : 'text-red-600')
                        }`}>
                          {getTransactionType(activity.type, activity.metadata) ? t(`history.${getTransactionType(activity.type, activity.metadata).toLowerCase()}`, getTransactionType(activity.type, activity.metadata)) : activity.description}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(activity.createdAt || activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        activity.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {activity.amount}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {activity.currency || 'TND'}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </motion.div>


      </div>

      {/* Credit Card Input Modal */}
      <CreditCardInput
        isOpen={isCreditCardOpen}
        onClose={() => setIsCreditCardOpen(false)}
        onSubmit={handleCreditCardSubmit}
      />

      {/* QR Scan Coming Soon Overlay */}
      {isQrScanOpen && (
        <ComingSoonOverlay
          title="QR Code Scanner"
          description="Scan QR codes to quickly send money to friends and family"
          onClose={() => setIsQrScanOpen(false)}
        />
      )}

      {/* Action Animation */}
      <ActionAnimation
        isVisible={showAnimation}
        type={animationType}
        onClose={() => setShowAnimation(false)}
      />
    </div>
  );
};

export default Wallet;
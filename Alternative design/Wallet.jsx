import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Send,
  Download,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      change: '+2.5%',
      isPositive: true,
      icon: WalletIcon
    },
    {
      name: t('wallet.bankAccount'),
      balance: userProfile.bankBalance,
      currency: 'TND',
      change: '-1.2%',
      isPositive: false,
      icon: Building2
    }
  ];

  useEffect(() => {
    const fetchBankAccount = async () => {
      if (userProfile?.associatedBankAccount) {
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
      const response = await api.post('/api/wallet/top-up', {
        amount: cardData.amount,
        cardDetails: {
          number: cardData.number,
          name: cardData.name,
          expiry: cardData.expiry,
          cvv: cardData.cvv
        }
      });
      
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}

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
            <WalletIcon className="w-7 h-7 text-blue-500" />
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
              {t('wallet.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400"
            >
              {t('wallet.subtitle')}
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
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wallets.map((wallet, index) => (
              <motion.div
                key={wallet.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                    <div className="p-3 bg-blue-600/20 rounded-xl">
                      <wallet.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className={`flex items-center text-sm ${
                      wallet.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {wallet.change}
                      {wallet.isPositive ? (
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 ml-1" />
                      )}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{wallet.name}</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {wallet.currency} {wallet.balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
              className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {t('wallet.send')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('wallet.receive')}
            </motion.button>
            <Link to="/transfer">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-5 h-5" />
                {t('wallet.transfer')}
              </motion.button>
            </Link>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${
              isDark ? 'bg-gray-800/50' : 'bg-white'
            } rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            } shadow-xl`}
          >
            <h3 className="text-xl font-semibold mb-6">{t('wallet.quickActions')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreditCardOpen(true)}
                className={`p-4 rounded-xl ${
                  isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-all flex items-center gap-3 group`}
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-medium">{t('wallet.addMoney')}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsQrScanOpen(true)}
                className={`p-4 rounded-xl ${
                  isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-all flex items-center gap-3 group`}
              >
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <QrCode className="w-5 h-5 text-purple-500" />
                </div>
                <span className="font-medium">{t('wallet.scanQr')}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Recent Activity */}
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">{t('wallet.recentActivity')}</h3>
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('wallet.noTransactions')}
              </div>
            ) : (
              transactions.map((tx, index) => (
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
                        tx.type === 'send' 
                          ? isDark ? 'bg-red-900/20' : 'bg-red-100'
                          : isDark ? 'bg-green-900/20' : 'bg-green-100'
                      }`}>
                        {tx.type === 'send' ? (
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
                          {tx.type === 'send' ? t('wallet.sent') : t('wallet.received')} {tx.currency}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        tx.type === 'send' 
                          ? isDark ? 'text-red-400' : 'text-red-500'
                          : isDark ? 'text-green-400' : 'text-green-500'
                      }`}>
                        {tx.type === 'send' ? '-' : '+'}{Math.abs(tx.amount)} {tx.currency}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tx.status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCreditCardOpen && (
          <CreditCardInput
            onSubmit={handleCreditCardSubmit}
            onClose={() => setIsCreditCardOpen(false)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnimation && (
          <ActionAnimation
            type={animationType}
            onClose={() => setShowAnimation(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQrScanOpen && (
          <ComingSoonOverlay
            onClose={() => setIsQrScanOpen(false)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
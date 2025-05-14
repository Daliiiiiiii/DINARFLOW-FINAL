import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { useTheme } from '../contexts/ThemeContext';
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, CreditCard, QrCode, Building2, ArrowLeftRight } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import KYCOverlay from '../layouts/KYCOverlay';
import CreditCardInput from '../components/CreditCardInput';
import ActionAnimation from '../components/ActionAnimation';

const Wallet = () => {
  const { theme } = useTheme();
  const { transactions, fetchTransactions, loading } = useTransactions();
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [bankAccount, setBankAccount] = useState(null);
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  const [isCreditCardOpen, setIsCreditCardOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState('processing');

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
      // Here you would typically make an API call to process the payment
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnimationType('success');
      setTimeout(() => {
        setShowAnimation(false);
        setIsCreditCardOpen(false);
      }, 2000);
    } catch (error) {
      setAnimationType('error');
      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
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
              <h3 className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium mb-1`}>
                {wallet.name}
              </h3>
              <p className="text-3xl font-semibold mb-6">
                {wallet.currency} {wallet.balance}
              </p>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                  {t('wallet.send')}
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors">
                  {t('wallet.receive')}
                </button>
              </div>
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
            <button className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors flex items-center gap-3`}>
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
            {transactions.map((activity, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {activity.isPositive ? (
                      <ArrowDownRight className={`w-5 h-5 ${
                        activity.isPositive ? 'text-green-400' : 'text-red-400'
                      }`} />
                    ) : (
                      <ArrowUpRight className={`w-5 h-5 ${
                        activity.isPositive ? 'text-green-400' : 'text-red-400'
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.from}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    activity.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.amount}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Associated Bank Account */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">{t('wallet.bankAccount')}</h2>
          {bankAccountLoading ? (
            <div className="text-gray-500">Loading bank account...</div>
          ) : bankAccount ? (
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="mb-1 font-medium">{bankAccount.bankName}</div>
              <div className="mb-1 text-sm text-gray-500">{bankAccount.accountNumber}</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{bankAccount.balance?.toFixed(2) ?? '0.00'} TND</div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">{t('profile.noBankAccount') || 'No bank account assigned yet. Your bank account will be assigned after KYC review.'}</div>
          )}
        </div>
      </div>

      {/* Credit Card Input Modal */}
      <CreditCardInput
        isOpen={isCreditCardOpen}
        onClose={() => setIsCreditCardOpen(false)}
        onSubmit={handleCreditCardSubmit}
      />

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
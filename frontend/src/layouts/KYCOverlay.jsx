import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import KYCForm from '../components/ui/KYCForm';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const KYCOverlay = ({ className = '', status = 'unverified', rejectionReason = '' }) => {
  const [showKycForm, setShowKycForm] = useState(false);
  const { theme } = useTheme();
  const { startKycVerification } = useAuth();
  const isDark = theme === 'dark';
  const { t, i18n } = useTranslation();

  const handleKycSubmit = async (formData) => {
    try {
      await startKycVerification(formData, {
        frontId: formData.frontId,
        backId: formData.backId,
        selfieWithId: formData.selfieWithId
      });
      setShowKycForm(false);
      toast.success('KYC submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit KYC');
    }
  };

  let content;

  if (status === 'pending' || status === 'in_progress') {
    content = (
      <div className="text-center">
        <motion.div
          initial={{ y: 10 }}
          animate={{ y: [-10, 10] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-100/80'}`}
        >
          <Clock className={`w-10 h-10 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
        </motion.div>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent' : 'text-blue-700'}`}>
          {t('kycOverlay.kycVerificationInProgress')}
        </h2>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mb-6`}>
          {t('kycOverlay.kycVerificationInProgressDescription')}
        </p>
      </div>
    );
  } else if (status === 'rejected') {
    content = (
      <div className="text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-600/20' : 'bg-red-100/80'}`}>
          <AlertTriangle className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent' : 'text-red-600'}`}>
          {t('kycOverlay.kycVerificationRejected')}
        </h2>
        <p className={`${isDark ? 'text-red-300' : 'text-red-500'} mb-4`}>
          {rejectionReason ? rejectionReason : t('kycOverlay.kycVerificationRejectedDescription')}
        </p>
        <Link
          to="/profile"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
        >
          {t('kycOverlay.tryAgain')}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  } else {
    // Default: unverified
    content = (
      <div className="text-center">
        <motion.div
          initial={{ y: 10 }}
          animate={{ y: [-10, 10] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100/80'}`}
        >
          <ShieldCheck className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </motion.div>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent' : 'text-blue-700'}`}>
          {t('kycOverlay.completeKYCVerification')}
        </h2>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mb-6`}>
          {t('kycOverlay.completeKYCVerificationDescription')}
        </p>
        <div className={`space-y-4 ${isDark ? '' : 'text-left'}`}>
          <div className={`${isDark ? 'bg-gray-800/50' : 'bg-blue-50'} rounded-lg p-4 text-left`}>
            <h3 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-blue-700'}`}>{t('kycOverlay.requiredDocuments')}</h3>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
              <li>• {t('kycOverlay.validNationalIDCardCINorPassport')}</li>
              <li>• {t('kycOverlay.selfieWithYourIDDocument')}</li>
            </ul>
          </div>
          <button
            onClick={() => setShowKycForm(true)}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            {t('kycOverlay.startVerification')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`fixed inset-0 w-full h-full z-30 flex items-center justify-center ${
          isDark
            ? 'bg-black/30 backdrop-blur-lg'
            : 'bg-white/30 backdrop-blur-sm'
        }`}
        style={{ 
          marginLeft: '16rem', 
          marginTop: '4rem',
          width: 'calc(100% - 16rem)',
          height: 'calc(100% - 4rem)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-lg w-full border rounded-2xl p-8 relative overflow-hidden ${
            isDark
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800'
              : 'bg-white border-gray-300'
          }`}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`${isDark ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent' : 'bg-gradient-to-br from-blue-200/10 via-purple-200/10 to-transparent'} absolute top-0 left-0 w-full h-full`} />
            <div className={`${isDark ? 'bg-gradient-to-tl from-blue-500/10 via-purple-500/10 to-transparent blur-3xl' : 'bg-gradient-to-tl from-blue-200/10 via-purple-200/10 to-transparent blur-xl'} absolute bottom-0 right-0 w-2/3 h-2/3`} />
          </div>
          <div className="relative">{content}</div>
        </motion.div>
      </div>
      {showKycForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <KYCForm onClose={() => setShowKycForm(false)} onSubmit={handleKycSubmit} />
        </div>
      )}
    </div>
  );
};

export default KYCOverlay;
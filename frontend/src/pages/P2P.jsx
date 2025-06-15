import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { Search, Filter, ChevronDown, X, Send, Clock, CheckCircle, AlertTriangle, Shield, DollarSign, CreditCard, Ban as Bank, Wallet, ArrowRight, Plus, MessageSquare, Star, ThumbsUp, User, ArrowUpRight, Building2, Smartphone, Cast as Cash, XCircle, AlertOctagon, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import P2PChat from '../components/P2PChat';
import P2PProfileSetup from '../components/P2PProfileSetup';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../assets/animations/LoadingSpinner';
import ActionLoader from '../assets/animations/ActionLoader';
import KYCOverlay from '../layouts/KYCOverlay';

// Add new OrderStatusAnimation component
const OrderStatusAnimation = ({ status, onComplete }) => {
  const { t } = useTranslation();
  const isSuccess = status === 'completed';
  const isCancelled = status === 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <X className="w-12 h-12 text-red-400" />
          )}
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold mb-2"
        >
          {isSuccess ? t('p2p.order.status.completed') : t('p2p.order.status.cancelled')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          {isSuccess 
            ? t('p2p.order.successMessage')
            : t('p2p.order.cancelledMessage')}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 transition-all"
          >
            {t('common.close')}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Add new DuplicateOrderAnimation component
const DuplicateOrderAnimation = ({ onClose }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-yellow-500/20"
        >
          <AlertTriangle className="w-12 h-12 text-yellow-400" />
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold mb-2 text-white"
        >
          {t('p2p.errors.duplicateOrder')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          {t('p2p.errors.duplicateOrderMessage')}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl text-yellow-400 transition-all"
          >
            {t('common.close')}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Add new CancelConfirmation component
const CancelConfirmation = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-yellow-500/20"
        >
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-4 text-center"
        >
          {t('p2p.order.confirmCancel')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6 text-center"
        >
          {t('p2p.confirmations.noPaymentMade')}
        </motion.p>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="confirm-cancel"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500/20"
          />
          <label htmlFor="confirm-cancel" className="text-gray-300">
            {t('p2p.confirmations.noPaymentMade')}
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition-all"
          >
            {t('common.close')}
          </button>
          <button
            onClick={() => {
              if (confirmed) {
                onConfirm();
                onClose();
              } else {
                toast.error(t('p2p.errors.confirmNoPayment'));
              }
            }}
            className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!confirmed}
          >
            {t('p2p.order.cancelOrder')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add new ReleaseConfirmation component
const ReleaseConfirmation = ({ onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-500/20"
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-4 text-center"
        >
          {t('p2p.order.confirmRelease')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6 text-center"
        >
          {t('p2p.confirmations.releaseFunds')}
        </motion.p>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="confirm-release"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500/20"
          />
          <label htmlFor="confirm-release" className="text-gray-300">
            {t('p2p.confirmations.paymentConfirmation')}
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition-all"
          >
            {t('common.close')}
          </button>
          <button
            onClick={() => {
              if (confirmed) {
                onConfirm();
                onClose();
              } else {
                toast.error(t('p2p.errors.confirmPayment'));
              }
            }}
            className="flex-1 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!confirmed}
          >
            {t('p2p.order.releaseFunds')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add new DisputesModal component
const DisputesModal = ({ onClose, setActiveOrder, setShowChat }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/p2p/disputes');
        // Ensure all required fields are present
        const validDisputes = response.data.filter(dispute => 
          dispute && 
          dispute._id && 
          dispute.offer && 
          dispute.buyer && 
          dispute.seller
        );
        setDisputes(validDisputes);
        setError(null);
      } catch (err) {
        console.error('Error fetching disputes:', err);
        setError('Failed to load disputes. Please try again.');
        toast.error('Failed to load disputes');
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  const handleResolveDispute = async (disputeId, resolution) => {
    try {
      await axios.post(`/api/p2p/disputes/${disputeId}/resolve`, { resolution });
      toast.success('Dispute resolved successfully');
      // Refresh the disputes list
      const response = await axios.get('/api/p2p/disputes');
      const validDisputes = response.data.filter(dispute => 
        dispute && 
        dispute._id && 
        dispute.offer && 
        dispute.buyer && 
        dispute.seller
      );
      setDisputes(validDisputes);
    } catch (err) {
      console.error('Error resolving dispute:', err);
      toast.error('Failed to resolve dispute');
    }
  };

  const handleJoinChat = async (order) => {
    try {
      // Fetch the full order details
      const response = await axios.get(`/api/p2p/orders/${order._id}`);
      setActiveOrder(response.data);
      setShowChat(true);
    } catch (error) {
      console.error('Error joining chat:', error);
      toast.error('Failed to join chat');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className={`${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertOctagon className="w-6 h-6 text-red-400" />
            Disputes
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No disputes found
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute._id}
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Order #{dispute._id.slice(-6)}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Amount: {dispute.amount} {dispute.offer.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleJoinChat(dispute)}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute._id, 'refund_buyer')}
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                    >
                      Refund Buyer
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute._id, 'release_seller')}
                      className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-400 transition-all"
                    >
                      Release to Seller
                    </button>
                  </div>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Buyer: {dispute.buyer.username}</p>
                  <p>Seller: {dispute.seller.username}</p>
                  <p>Dispute Reason: {dispute.disputeDetails ? dispute.disputeDetails : 'No reason provided'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const DisputeAnimation = ({ status, onClose }) => {
  const { t } = useTranslation();
  const isSuccess = status === 'success';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400" />
          )}
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold mb-2"
        >
          {isSuccess ? t('p2p.dispute.success') : t('p2p.dispute.error')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          {isSuccess 
            ? t('p2p.dispute.successMessage')
            : t('p2p.dispute.errorMessage')}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onClose}
            className={`px-6 py-3 ${
              isSuccess 
                ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400'
                : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
            } border rounded-xl transition-all`}
          >
            {t('common.close')}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const PaymentVerificationModal = ({ onClose, onConfirm, orderId, setMessages }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      toast.error('Please select a payment proof image');
      return;
    }

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await onConfirm(orderId, reader.result, setMessages);
          onClose();
        } catch (error) {
          console.error('Error in handleConfirm:', error);
          toast.error('Failed to verify payment');
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to process image');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-500/20"
        >
          <ImageIcon className="w-8 h-8 text-blue-400" />
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-4 text-center"
        >
          Upload Payment Proof
        </motion.h3>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <p className="text-gray-400">Click to upload payment proof</p>
                <p className="text-sm text-gray-500">Supported formats: JPG, PNG</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </motion.div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition-all"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFile || isSubmitting}
            className="flex-1 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Uploading...' : 'Upload and Verify'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const P2P = () => {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useAuth();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('buy');
  const [showChat, setShowChat] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [amount, setAmount] = useState('');
  const [tndAmountInput, setTndAmountInput] = useState('');
  const [showMaxAmountWarning, setShowMaxAmountWarning] = useState(false);
  const [transactionStep, setTransactionStep] = useState(1);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [userOrders, setUserOrders] = useState([]);
  const [orderTimers, setOrderTimers] = useState({});
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState(null);
  const socketRef = useRef(null);
  const [createOfferData, setCreateOfferData] = useState({
    type: 'buy',
    price: '3.2',
    minAmount: '',
    maxAmount: '',
    amount: '',
    description: '',
    orderLength: '1'
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [duplicateOrderMessage, setDuplicateOrderMessage] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerCreationStatus, setOfferCreationStatus] = useState(null);
  const [offerCreationMessage, setOfferCreationMessage] = useState('');
  // Add state for reactivation error animation
  const [reactivateError, setReactivateError] = useState(null);
  const [showPaymentVerification, setShowPaymentVerification] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [showStatusAnimation, setShowStatusAnimation] = useState(false);
  const [statusAnimationType, setStatusAnimationType] = useState(null);
  // Add new state for modal payment methods
  const [offerSelectedMethods, setOfferSelectedMethods] = useState([]);
  const [showDuplicateOrderAnimation, setShowDuplicateOrderAnimation] = useState(false);
  const [modalSelectedPaymentMethod, setModalSelectedPaymentMethod] = useState('');
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showReleaseConfirmation, setShowReleaseConfirmation] = useState(false);
  const [orderToRelease, setOrderToRelease] = useState(null);
  // Add state for tracking error timeout
  const [errorTimeout, setErrorTimeout] = useState(null);
  const errorTimeoutRef = useRef(null); // Add ref to track timeout
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [showDisputes, setShowDisputes] = useState(false);
  const [showDisputeAnimation, setShowDisputeAnimation] = useState(false);
  const [disputeAnimationStatus, setDisputeAnimationStatus] = useState(null);
  // Show KYCOverlay if user is not verified
  const showKycOverlay = currentUser && currentUser.kyc?.status !== 'verified';
  const kycStatus = currentUser?.kyc?.status || 'unverified';
  const rejectionReason = currentUser?.kyc?.verificationNotes || '';
  const [messages, setMessages] = useState([
    { id: 1, type: 'seller', content: "Hello! I see you're interested in buying USDT.", time: '2:30 PM' },
    { id: 2, type: 'buyer', content: 'Yes, I\'d like to buy 500 USDT.', time: '2:31 PM' },
    { id: 3, type: 'seller', content: 'Great! I can process that for you. Please confirm the amount and rate.', time: '2:32 PM' }
  ]);

  const orderLengthOptions = [
    { value: '0.25', label: '15 minutes' },
    { value: '0.5', label: '30 minutes' },
    { value: '1', label: '1 hour' },
    { value: '3', label: '3 hours' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '24 hours' },
    { value: '48', label: '48 hours' },
    { value: '78', label: '78 hours' }
  ];

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!currentUser?._id) {
        console.log('No current user, skipping wallet fetch');
        return;
      }

      try {
        console.log('Fetching wallet data for user:', currentUser._id);
        const response = await axios.get('/api/wallet', {
          params: {
            userId: currentUser._id
          }
        });
        console.log('Wallet data response:', response.data);
        setWalletData(response.data);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error('Failed to fetch wallet data');
      }
    };

    fetchWalletData();
  }, [currentUser]);

  // Add debug log for wallet data changes
  useEffect(() => {
    console.log('Wallet data updated:', walletData);
  }, [walletData]);

  // Check if user has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!currentUser?._id) {
        setCheckingProfile(false);
        return;
      }

      try {
        setCheckingProfile(true);
        const response = await axios.get(`/api/p2p/profile/${currentUser._id}`);
        setHasProfile(true);
      } catch (error) {
        if (error.response?.status === 404) {
          setHasProfile(false);
        } else {
          console.error('Error checking profile:', error);
          toast.error('Failed to check profile status');
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [currentUser]);

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const params = { 
          type: activeTab === 'buy' ? 'sell' : 'buy',
          includeInactive: viewMode === 'active' ? 'true' : 'false',
          includeActive: 'true'
        };

        // If viewing active offers and user is logged in, fetch their offers
        if (viewMode === 'active' && currentUser?._id) {
          params.my = 'true';
        }

        // Always include blocked status in the response
        if (currentUser?._id) {
          params.includeBlockedStatus = 'true';
        }

        const response = await axios.get('/api/p2p/offers', { params });
        
        // Filter out offers from blocked users on the frontend
        const filteredOffers = response.data.filter(offer => {
          if (!offer.user || !currentUser) return true;
          return !offer.user.blockedUsers?.includes(currentUser._id) && 
                 !currentUser.blockedUsers?.includes(offer.user._id);
        });

        setOffers(filteredOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to fetch offers');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [activeTab, viewMode, currentUser]);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    // Function to initialize socket listeners
    const initializeSocketListeners = (socket) => {
      // Handle order updates
      socket.on('orderUpdate', (updatedOrder) => {
        console.log('Order update received:', updatedOrder);
        // Update active order if it matches
        if (activeOrder && activeOrder._id === updatedOrder._id) {
          setActiveOrder(updatedOrder);
        }
        // Update in userOrders list
        setUserOrders(prevOrders => {
          const newOrders = prevOrders.map(order =>
            order._id === updatedOrder._id ? updatedOrder : order
          );
          return newOrders;
        });
      });

      // Handle notifications
      socket.on('notification:received', (data) => {
        console.log('Received notification in P2P:', data);
        if (data.notification.type === 'transaction') {
          // If it's a message notification, we don't need to do anything
          // as the message will be handled by P2PChat component
          if (data.notification.data?.type === 'new_message') {
            return;
          }
        }
      });
    };

    // Function to clean up socket listeners
    const cleanupSocketListeners = (socket) => {
      if (socket) {
        socket.off('orderUpdate');
        socket.off('notification:received');
      }
    };

    // Check if socket is already available
    if (window.socket) {
      console.log('Socket already available, initializing listeners');
      initializeSocketListeners(window.socket);
    } else {
      console.log('Waiting for socket to be available...');
      // Set up an interval to check for socket availability
      const socketCheckInterval = setInterval(() => {
        if (window.socket) {
          console.log('Socket became available, initializing listeners');
          clearInterval(socketCheckInterval);
          initializeSocketListeners(window.socket);
        }
      }, 1000); // Check every second

      // Clean up interval if component unmounts
      return () => {
        clearInterval(socketCheckInterval);
        cleanupSocketListeners(window.socket);
      };
    }

    // Clean up listeners when component unmounts or dependencies change
    return () => cleanupSocketListeners(window.socket);
  }, [currentUser, activeOrder]);

  // Add a separate effect to handle order status changes
  useEffect(() => {
    const refreshOrders = async () => {
      try {
        const response = await axios.get('/api/p2p/orders');
        setUserOrders(response.data);
        
        // If there's an active order in chat, refresh it too
        if (activeOrder) {
          const orderResponse = await axios.get(`/api/p2p/orders/${activeOrder._id}`);
          setActiveOrder(orderResponse.data);
        }
      } catch (error) {
        console.error('Error refreshing orders:', error);
      }
    };

    // Refresh orders every 5 seconds
    const interval = setInterval(refreshOrders, 5000);

    return () => clearInterval(interval);
  }, [activeOrder]); // Add activeOrder as dependency

  // Background animation
  const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }));
  const bind = useDrag(({ movement: [mx, my] }) => {
    set({ xy: [mx, my] });
  });

  const paymentMethods = [
    {
      id: 'tnd_wallet',
      name: 'Dinarflow TND Wallet',
      icon: Wallet,
      description: 'Pay using your TND wallet balance',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer directly to bank account',
      processingTime: '1-24 hours',
      fee: '0-1%',
      isPopular: true
    },
    {
      id: 'flouci',
      name: 'Flouci App',
      icon: Smartphone,
      description: 'Pay with Flouci app',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'd17',
      name: 'D17 App',
      icon: Smartphone,
      description: 'Pay with D17 app',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'postepay',
      name: 'Postepay',
      icon: CreditCard,
      description: 'Pay with Postepay',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'phone_balance',
      name: 'Phone Balance',
      icon: Smartphone,
      description: 'Pay using your phone credit',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    }
  ];

  const togglePaymentMethod = (methodId) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
    // Also update offerSelectedMethods
    setOfferSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedOffer) return;

    try {
      // Here you would implement the chat functionality
      // For now, we'll just clear the message
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const checkExistingOrder = (offer) => {
    // Check for orders with the same offer
    const hasOrderWithOffer = userOrders.some(order =>
      order.offerId === offer._id &&
      ['pending', 'paid'].includes(order.status)
    );

    // Check for orders with the same user
    const hasOrderWithUser = userOrders.some(order => {
      const isSameUser = order.seller?._id === offer.seller._id || order.buyer?._id === offer.seller._id;
      const isActiveOrder = ['pending', 'paid'].includes(order.status);
      return isSameUser && isActiveOrder;
    });

    return hasOrderWithOffer || hasOrderWithUser;
  };

  const handleTransaction = async (offer) => {
    if (!currentUser) {
      toast.error('Please login to start a transaction');
      navigate('/login');
      return;
    }

    if (checkExistingOrder(offer)) {
      setShowDuplicateOrderAnimation(true);
      return;
    }

    setSelectedOffer(offer);
    setShowTransactionModal(true);
    setTransactionStep(1);
    setAmount(''); // Clear USDT amount
    setTndAmountInput(''); // Clear TND input
    setShowMaxAmountWarning(false); // Hide warning when opening modal
    setModalSelectedPaymentMethod(''); // Reset modal payment method
  };

  const handleConfirmTransaction = async () => {
    const enteredTndAmount = parseFloat(tndAmountInput);
    const enteredUsdtAmount = parseFloat(amount);

    if (!enteredTndAmount || !enteredUsdtAmount || !modalSelectedPaymentMethod || !selectedOffer) {
      toast.error('Please enter a valid amount and select a payment method');
      return;
    }

    try {
      setTransactionStep(2);

      // Validate amount against offer limits
      if (enteredTndAmount < selectedOffer.minAmount) {
        toast.error(`Amount cannot be less than ${selectedOffer.minAmount} TND`);
        setTransactionStep(1);
        return;
      }

      if (enteredTndAmount > selectedOffer.maxAmount) {
        toast.error(`Amount cannot exceed ${selectedOffer.maxAmount} TND`);
        setTransactionStep(1);
        return;
      }

      // Check for insufficient wallet balance if using TND wallet
      if (modalSelectedPaymentMethod === 'tnd_wallet') {
        if (enteredTndAmount > (currentUser?.walletBalance || 0)) {
          toast.error(`Insufficient balance. You need ${enteredTndAmount.toFixed(2)} TND but have ${(currentUser?.walletBalance || 0).toFixed(2)} TND`);
          setTransactionStep(1);
          return;
        }
      }

      // Create the order with all required fields
      const orderData = {
        offerId: selectedOffer._id,
        amount: enteredUsdtAmount,
        paymentMethod: modalSelectedPaymentMethod,
        type: selectedOffer.type,
        price: parseFloat(selectedOffer.price)
      };

      // Debug logging
      console.log('Selected Offer:', selectedOffer);
      console.log('Current User:', currentUser);
      console.log('Creating order with data:', orderData);

      // Validate all required fields are present and not undefined
      const requiredFields = ['offerId', 'amount', 'paymentMethod', 'type', 'price'];
      const missingFields = requiredFields.filter(field => !orderData[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        setTransactionStep(1);
        return;
      }

      // Add request headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.post('/api/p2p/orders', orderData, config);

      if (response.data) {
        // If payment method is DinarFlow wallet, automatically process the payment
        if (modalSelectedPaymentMethod === 'tnd_wallet') {
          try {
            console.log('Starting automatic payment process...');
            
            // Process the automatic payment
            const paymentResponse = await axios.post(`/api/p2p/orders/${response.data._id}/process-payment`);
            console.log('Payment process response:', paymentResponse.data);

            // Update the current user's balances
            if (paymentResponse.data.buyerBalance) {
              setCurrentUser(prev => ({
                ...prev,
                walletBalance: paymentResponse.data.buyerBalance.tnd,
                wallet: {
                  ...prev.wallet,
                  globalUsdtBalance: paymentResponse.data.buyerBalance.usdt
                }
              }));
            }

            // Update the response data with completed status
            response.data.status = 'completed';
            console.log('Automatic payment process completed successfully');
          } catch (error) {
            console.error('Error processing automatic payment:', error);
            console.error('Error details:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
            toast.error(error.response?.data?.message || 'Failed to process automatic payment');
            setTransactionStep(1);
            return;
          }
        }

        setTransactionStep(3);
        setActiveOrder(response.data);
        setShowChat(true);
        toast.success('Order created successfully');
        
        // Update orders list
        setUserOrders(prevOrders => [response.data, ...prevOrders.filter(order => order._id !== response.data._id)]);

        // Update the offer in the offers list
        if (response.data.offer) {
          setOffers(prevOffers =>
            prevOffers.map(offer =>
              offer._id === response.data.offer._id ? response.data.offer : offer
            )
          );
        }

        // Emit socket event for real-time notification
        window.socket.emit('notification:update', {
          orderId: response.data._id,
          type: 'transaction',
          title: 'New Order Created',
          message: `A new order has been created for ${response.data.amount} USDT`,
          data: {
            orderId: response.data._id,
            amount: response.data.amount,
            type: 'new_order'
          }
        });

        // Close transaction modal immediately after success
        setShowTransactionModal(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid order data';
        console.error('Validation error details:', error.response.data);
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        toast.error('Please login to create an order');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to create this order');
      } else if (error.response?.status === 404) {
        toast.error('Offer not found');
      } else if (error.response?.status === 409) {
        toast.error('You already have an active order with this user');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create order');
      }
      
      setTransactionStep(1);
    }
  };

  // Add function to calculate TND equivalent
  const calculateTNDEquivalent = (usdtAmount, price) => {
    if (!usdtAmount || !price) return '';
    const tndAmount = parseFloat(usdtAmount) * parseFloat(price);
    return tndAmount.toFixed(2);
  };

  const handleCreateOfferChange = (e) => {
    const { name, value } = e.target;

    // Skip all validation for type changes (tab switches)
    if (name === 'type') {
      setCreateOfferData({
        type: value,
        price: '3.2',
        minAmount: '',
        maxAmount: '',
        amount: '',
        description: '',
        orderLength: '1'
      });
      return;
    }

    // Handle price changes
    if (name === 'price') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || (numValue >= 0.1 && numValue <= 100)) {
          setCreateOfferData(prev => ({
            ...prev,
            [name]: value
          }));
        } else {
          toast.error('Price must be between 0.1 and 100 TND');
        }
      }
      return;
    }

    // Handle min/max amount changes
    if (name === 'minAmount' || name === 'maxAmount') {
      // Allow empty value or any number input
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCreateOfferData(prev => ({
          ...prev,
          [name]: value
        }));

        // Only validate if both min and max are set
        if (value !== '' && createOfferData.minAmount && createOfferData.maxAmount) {
          const minValue = parseFloat(createOfferData.minAmount);
          const maxValue = parseFloat(createOfferData.maxAmount);

          if (name === 'minAmount' && minValue < 10) {
            toast.error('Minimum amount must be at least 10 TND');
          }

          if (name === 'maxAmount' && maxValue > 20000) {
            toast.error('Maximum amount cannot exceed 20000 TND');
          }

          if (minValue >= maxValue) {
            toast.error('Minimum amount must be less than maximum amount');
          }
        }
      }
      return;
    }

    // Handle amount changes
    if (name === 'amount') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCreateOfferData(prev => ({
          ...prev,
          [name]: value
        }));

        // Only validate if we have all required values
        if (value !== '' && createOfferData.price && createOfferData.minAmount) {
          const amount = parseFloat(value);
          const price = parseFloat(createOfferData.price);
          const minAmount = parseFloat(createOfferData.minAmount);
          const availableAmountTND = amount * price;

          // If selling, validate against available balance
          if (createOfferData.type === 'sell') {
            const availableBalance = walletData?.globalUsdtBalance || 0;
            if (amount > availableBalance) {
              toast.error(`Amount cannot exceed your available balance of ${availableBalance} USDT`);
            }
          }

          // If buying with TND wallet, validate against TND balance
          if (createOfferData.type === 'buy' && selectedMethods.includes('tnd_wallet')) {
            const tndBalance = currentUser?.walletBalance || 0;
            if (availableAmountTND > tndBalance) {
              toast.error(`Amount cannot exceed your TND wallet balance equivalent of ${(tndBalance / price).toFixed(2)} USDT`);
            }
          }
        }
      }
      return;
    }

    // Handle other fields
    setCreateOfferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateOfferSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    if (!currentUser) {
      setOfferCreationStatus('error');
      setOfferCreationMessage('Please login to create an offer');
      errorTimeoutRef.current = setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
        navigate('/login');
      }, 2000);
      return;
    }

    if (!hasProfile) {
      setOfferCreationStatus('error');
      setOfferCreationMessage('Please set up your P2P profile first');
      setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
        navigate(`/p2p/${currentUser.id}`);
      }, 2000);
      return;
    }

    if (offerSelectedMethods.length === 0) {
      setOfferCreationStatus('error');
      setOfferCreationMessage('Please select at least one payment method');
      setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
      return;
    }

    // Validate amounts only during form submission
    const price = parseFloat(createOfferData.price);
    const minAmountTND = parseFloat(createOfferData.minAmount);
    const maxAmountTND = parseFloat(createOfferData.maxAmount);
    const amount = parseFloat(createOfferData.amount);
    const availableAmountTND = amount * price;

    if (availableAmountTND < minAmountTND) {
      setOfferCreationStatus('error');
      setOfferCreationMessage(`Available amount (${availableAmountTND.toFixed(2)} TND) cannot be less than minimum amount (${minAmountTND.toFixed(2)} TND)`);
      errorTimeoutRef.current = setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
      return;
    }

    try {
      // Convert amounts to TND for validation
      const price = parseFloat(createOfferData.price);
      const minAmountTND = parseFloat(createOfferData.minAmount);
      const maxAmountTND = parseFloat(createOfferData.maxAmount);
      const availableAmountTND = parseFloat(createOfferData.amount) * price;

      // If available amount is less than minimum, show error
      if (availableAmountTND < minAmountTND) {
        setOfferCreationStatus('error');
        setOfferCreationMessage(`Available amount (${availableAmountTND.toFixed(2)} TND) cannot be less than minimum amount (${minAmountTND.toFixed(2)} TND)`);
        errorTimeoutRef.current = setTimeout(() => {
          setOfferCreationStatus(null);
          setOfferCreationMessage('');
        }, 2000);
        return;
      }

      // If available amount is less than maximum, adjust maximum down
      const adjustedMaxAmount = Math.min(maxAmountTND, availableAmountTND);
      
      let response;
      if (editingOffer) {
        // Update existing offer
        response = await axios.put(`/api/p2p/offers/${editingOffer._id}`, {
          amount: parseFloat(createOfferData.amount),
          price: parseFloat(createOfferData.price),
          minAmount: parseFloat(createOfferData.minAmount),
          maxAmount: adjustedMaxAmount,
          paymentMethods: offerSelectedMethods,
          description: createOfferData.description,
          status: 'active' // Reactivate the offer when editing
        });
        setOfferCreationStatus('success');
        setOfferCreationMessage('Offer updated successfully');
      } else {
        // Create new offer
        response = await axios.post('/api/p2p/offers', {
          type: createOfferData.type,
          amount: parseFloat(createOfferData.amount),
          price: parseFloat(createOfferData.price),
          minAmount: parseFloat(createOfferData.minAmount),
          maxAmount: adjustedMaxAmount,
          paymentMethods: offerSelectedMethods,
          description: createOfferData.description,
          orderLength: createOfferData.orderLength
        });
        setOfferCreationStatus('success');
        setOfferCreationMessage('Offer created successfully');
      }
      
      setOffers(prev => {
        if (editingOffer) {
          return prev.map(offer => offer._id === editingOffer._id ? response.data : offer);
        }
        return [response.data, ...prev];
      });

      // Wait for 2 seconds to show the success animation
      setTimeout(() => {
        setShowCreateOffer(false);
        setEditingOffer(null);
        setCreateOfferData({
          type: 'buy',
          price: '',
          minAmount: '',
          maxAmount: '',
          amount: '',
          description: '',
          orderLength: '1'
        });
        setOfferSelectedMethods([]);
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error creating/updating offer:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message?.includes('already have an active offer')) {
        setOfferCreationStatus('error');
        setOfferCreationMessage('You already have an active offer of this type');
      } else if (error.response?.data?.message?.includes('insufficient balance')) {
        setOfferCreationStatus('error');
        setOfferCreationMessage('Insufficient balance for this transaction');
      } else if (error.response?.data?.message?.includes('invalid amount')) {
        setOfferCreationStatus('error');
        setOfferCreationMessage('Invalid amount specified');
      } else if (error.response?.data?.message?.includes('invalid price')) {
        setOfferCreationStatus('error');
        setOfferCreationMessage('Invalid price specified');
      } else {
        setOfferCreationStatus('error');
        setOfferCreationMessage(error.response?.data?.message || 'Failed to create/update offer');
      }
      
      errorTimeoutRef.current = setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
    }
  };

  const handleProfileClick = () => {
    if (!currentUser) {
      toast.error('Please login to view your profile');
      navigate('/login');
      return;
    }

    if (checkingProfile) {
      toast.error('Please wait while we check your profile status');
      return;
    }

    if (!hasProfile) {
      setShowProfileSetup(true);
    } else {
      navigate(`/p2p/${currentUser._id}`);
    }
  };

  // Filter offers based on view mode
  const filteredOffers = offers.filter(offer => {
    // First apply search and payment method filters
    const matchesSearch = !searchTerm ||
      (offer.seller?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPaymentMethods = selectedMethods.length === 0 ||
      selectedMethods.some(method => offer.paymentMethods?.includes(method));

    // Then apply view mode filter
    if (viewMode === 'all') {
      return matchesSearch && matchesPaymentMethods;
    } else if (viewMode === 'active') {
      return matchesSearch && matchesPaymentMethods && offer.seller?._id === currentUser?._id;
    }

    return matchesSearch && matchesPaymentMethods;
  });

  // Add useEffect to fetch user's orders
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser) return;

      try {
        const response = await axios.get('/api/p2p/orders');
        // Use a Map to ensure unique orders based on _id
        const uniqueOrders = new Map();
        response.data.forEach(order => {
          if (!uniqueOrders.has(order._id)) {
            uniqueOrders.set(order._id, order);
          }
        });
        // Convert Map values back to array
        setUserOrders(Array.from(uniqueOrders.values()));
      } catch (error) {
        console.error('Error fetching user orders:', error);
        toast.error('Failed to fetch your orders');
      }
    };

    fetchUserOrders();
  }, [currentUser]);

  // Add function to calculate remaining time
  const calculateRemainingTime = (order) => {
    // If order is no longer pending, show status instead of timer
    if (['paid', 'completed', 'cancelled', 'disputed'].includes(order.status)) {
      return order.status.charAt(0).toUpperCase() + order.status.slice(1);
    }

    const createdAt = new Date(order.createdAt).getTime();
    const orderLength = parseFloat(order.orderLength || 1) * 60 * 60 * 1000; // Convert hours to milliseconds
    const expiryTime = createdAt + orderLength;
    const now = Date.now();
    const remaining = expiryTime - now;

    if (remaining <= 0) {
      // Auto-cancel expired orders
      if (order.status === 'pending') { // Only auto-cancel if still pending
        handleAutoCancel(order);
      }
      return 'Expired';
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Add function to handle auto-cancellation
  const handleAutoCancel = async (order) => {
    // Only auto-cancel if the order is still pending
    if (order.status !== 'pending') {
      console.log(`Order ${order._id} is not pending, skipping auto-cancel.`);
      return;
    }

    try {
      console.log(`Attempting to auto-cancel order ${order._id}...`);
      await axios.put(`/api/p2p/orders/${order._id}`, {
        status: 'cancelled',
        reason: 'timeout'
      });
      // Refresh orders
      const response = await axios.get('/api/p2p/orders');
      const openOrders = response.data.filter(order =>
        ['pending', 'paid'].includes(order.status)
      );
      setUserOrders(openOrders);
      toast.error('Order automatically cancelled due to timeout');
    } catch (error) {
      console.error('Error auto-cancelling order:', error);
      // Handle potential errors (e.g., order already updated by user)
      if (error.response?.status === 404) {
        console.log(`Order ${order._id} not found or already updated.`);
      } else {
        toast.error('Failed to auto-cancel order');
      }
    }
  };

  // Add useEffect to update timers and handle initial timer setup
  useEffect(() => {
    const timers = {};
    userOrders.forEach(order => {
      if (!['paid', 'completed', 'cancelled', 'disputed'].includes(order.status)) {
        timers[order._id] = setInterval(() => {
          setOrderTimers(prev => ({
            ...prev,
            [order._id]: calculateRemainingTime(order)
          }));
        }, 1000);
      }
    });

    return () => {
      // Clear all timers on component unmount or when userOrders changes
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [userOrders]); // Re-run effect when userOrders changes

  // Add this function to handle offer status changes
  const handleOfferStatusChange = async (offerId, newStatus) => {
    try {
      if (newStatus === 'active') {
        const offerToActivate = offers.find(offer => offer._id === offerId);
        if (!offerToActivate) return;
        const existingActiveOffer = offers.find(offer => 
          offer.seller?._id === currentUser._id && 
          offer.type === offerToActivate.type && 
          offer.status === 'active' &&
          offer._id !== offerId
        );
        if (existingActiveOffer) {
          setReactivateError(`You already have an active ${offerToActivate.type} offer. Please deactivate it first.`);
          setTimeout(() => setReactivateError(null), 2000);
          return;
        }
      }
      const response = await axios.put(`/api/p2p/offers/${offerId}`, { status: newStatus });
      setOffers(prev => prev.map(offer => offer._id === offerId ? response.data : offer));
      toast.success(`Offer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast.error(error.response?.data?.message || 'Failed to update offer status');
    }
  };

  // Add this function to handle offer editing
  const handleEditOffer = (offer) => {
    const existingActiveOffer = offers.find(o =>
      o.seller?._id === currentUser._id &&
      o.type === offer.type &&
      o.status === 'active' &&
      o._id !== offer._id
    );
    if (existingActiveOffer) {
      setReactivateError(`You already have an active ${offer.type} offer. Please deactivate it first.`);
      setTimeout(() => setReactivateError(null), 2000);
      return;
    }
    setEditingOffer(offer);
    setCreateOfferData({
      type: offer.type,
      price: offer.price.toString(),
      minAmount: offer.minAmount.toString(),
      maxAmount: offer.maxAmount.toString(),
      amount: offer.amount.toString(),
      description: offer.description || '',
      orderLength: offer.orderLength || '1'
    });
    setOfferSelectedMethods(offer.paymentMethods);
    setShowCreateOffer(true);
  };

  const handleReleaseFunds = async (orderId) => {
    setSelectedOrderId(orderId);
    setShowReleaseConfirmation(true);
  };

  const confirmReleaseFunds = async () => {
    try {
      // 1. Fetch order details
      const orderRes = await axios.get(`/api/p2p/orders/${selectedOrderId}`);
      const order = orderRes.data;
      // 2. Fetch seller and buyer wallets
      const [sellerWalletRes, buyerWalletRes] = await Promise.all([
        axios.get('/api/wallet', { params: { userId: order.seller._id } }),
        axios.get('/api/wallet', { params: { userId: order.buyer._id } })
      ]);
      const sellerWallet = sellerWalletRes.data;
      const buyerWallet = buyerWalletRes.data;
      // 3. Use the main address and network (default to 'ethereum')
      const network = 'ethereum';
      const fromAddress = sellerWallet.address;
      const toAddress = buyerWallet.address;
      // 4. Transfer USDT from seller to buyer
      await axios.post('/api/wallet/send', {
        network,
        toAddress,
        amount: order.amount
      });
      // 5. Mark order as completed
      await axios.put(`/api/p2p/orders/${selectedOrderId}`, {
        status: 'completed'
      });
      
      // Emit socket event for real-time update
      window.socket.emit('notification:update', {
        orderId: selectedOrderId,
        type: 'transaction',
        title: 'Funds Released',
        message: `USDT has been released for order #${selectedOrderId.slice(-6)}`,
        data: {
          orderId: selectedOrderId,
          type: 'funds_released'
        }
      });
      
      toast.success('Funds released successfully');
      setShowReleaseConfirmation(false);
      refreshOrders();
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error(error.response?.data?.message || 'Failed to release funds');
    }
  };

  const handlePaymentVerification = async (orderId, proof, setMessages) => {
    try {
      if (!orderId) {
        toast.error('Order ID is missing');
        return;
      }

      await axios.put(`/api/p2p/orders/${orderId}`, { 
        status: 'paid',
        paymentProof: proof 
      });
      
      // Emit socket event for real-time update
      window.socket.emit('notification:update', {
        orderId: orderId,
        type: 'transaction',
        title: 'Payment Marked as Paid',
        message: `Order #${orderId.slice(-6)} has been marked as paid`,
        data: {
          orderId: orderId,
          type: 'payment_verified'
        }
      });

      // Send payment proof as a message in the chat
      try {
        const messageResponse = await axios.post(`/api/p2p/orders/${orderId}/messages`, {
          content: 'Payment proof submitted',
          imageUrl: proof
        });

        // Emit socket event for real-time chat update
        window.socket.emit('chat:message', {
          orderId: orderId,
          message: {
            ...messageResponse.data,
            sender: currentUser
          }
        });

        // Update local messages state
        setMessages(prevMessages => [...prevMessages, {
          ...messageResponse.data,
          sender: currentUser
        }]);
      } catch (error) {
        console.error('Error sending payment proof to chat:', error);
      }

      toast.success('Payment marked as paid');
      setShowPaymentVerification(false);
      
      // Refresh the active order
      try {
        const response = await axios.get(`/api/p2p/orders/${orderId}`);
        setActiveOrder(response.data);
      } catch (error) {
        console.error('Error refreshing order:', error);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleDispute = async (orderId, reason, details) => {
    try {
      // Check if the order exists and can be disputed
      const order = userOrders.find(o => o._id === orderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Check if the order can be disputed
      if (!['pending', 'paid'].includes(order.status)) {
        toast.error('This order cannot be disputed');
        return;
      }

      // Show loading animation
      setShowDisputeModal(false);
      setTransactionStep(2);

      // Make the dispute request - backend will handle notifications
      const response = await axios.post(`/api/p2p/orders/${orderId}/dispute`, {
        reason,
        details
      });

      // Hide loading animation and show success animation
      setTransactionStep(0);
      setShowDisputeAnimation(true);
      setDisputeAnimationStatus('success');
      setDisputeReason('');
      setDisputeDetails('');

      // Refresh orders list
      const ordersResponse = await axios.get('/api/p2p/orders');
      setUserOrders(ordersResponse.data);

      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowDisputeAnimation(false);
        setDisputeAnimationStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Error filing dispute:', error);
      // Hide loading animation and show error animation
      setTransactionStep(0);
      setShowDisputeAnimation(true);
      setDisputeAnimationStatus('error');
      
      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowDisputeAnimation(false);
        setDisputeAnimationStatus(null);
      }, 2000);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 'Error filing dispute';
      toast.error(errorMessage);
    }
  };

  const handleCancelOrder = async (orderId, reason = 'user_cancelled') => {
    setSelectedOrderId(orderId);
    setCancelReason(reason);
    setShowCancelConfirmation(true);
  };

  const confirmCancelOrder = async () => {
    try {
      const order = userOrders.find(o => o._id === selectedOrderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Check if the order can be cancelled
      if (order.status === 'completed') {
        toast.error('Cannot cancel a completed order');
        return;
      }

      // Allow buyer to cancel even after marking as paid
      if (order.status === 'paid' && order.buyer._id === currentUser._id) {
        await axios.put(`/api/p2p/orders/${selectedOrderId}`, { 
          status: 'cancelled',
          cancelReason: cancelReason
        });
        
        // Emit socket event for real-time update
        window.socket.emit('notification:update', {
          orderId: selectedOrderId,
          type: 'transaction',
          title: 'Order Cancelled',
          message: `Order #${selectedOrderId.slice(-6)} has been cancelled`,
          data: {
            orderId: selectedOrderId,
            type: 'order_cancelled'
          }
        });

        toast.success('Order cancelled successfully');
        setShowCancelConfirmation(false);
        refreshOrders();
        return;
      }

      // For other cases, check if the user is authorized to cancel
      if (order.status !== 'pending' && order.status !== 'paid') {
        toast.error('This order cannot be cancelled');
        return;
      }

      if (order.buyer._id !== currentUser._id && order.seller._id !== currentUser._id) {
        toast.error('You are not authorized to cancel this order');
        return;
      }

      await axios.put(`/api/p2p/orders/${selectedOrderId}`, { 
        status: 'cancelled',
        cancelReason: cancelReason
      });
      
      // Emit socket event for real-time update
      window.socket.emit('notification:update', {
        orderId: selectedOrderId,
        type: 'transaction',
        title: 'Order Cancelled',
        message: `Order #${selectedOrderId.slice(-6)} has been cancelled`,
        data: {
          orderId: selectedOrderId,
          type: 'order_cancelled'
        }
      });

      toast.success('Order cancelled successfully');
      setShowCancelConfirmation(false);
      refreshOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Add effect to handle tab changes
  useEffect(() => {
    console.log('Tab switching to:', activeTab);
    
    // Clear any existing error timeout using ref
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Reset all states without triggering validation
    setSelectedMethods([]);
    setOfferSelectedMethods([]);
    setOfferCreationStatus(null);
    setOfferCreationMessage('');
    setShowCreateOffer(false);
    setShowMaxAmountWarning(false);
    setReactivateError(null);
    setErrorTimeout(null);
    
    // Reset any validation states
    setCreateOfferData({
      type: activeTab,
      price: '3.2',
      minAmount: '',
      maxAmount: '',
      amount: '',
      description: '',
      orderLength: '1'
    });

    // Clear any existing error messages
    const errorElements = document.querySelectorAll('.text-red-500');
    errorElements.forEach(element => {
      element.textContent = '';
    });
  }, [activeTab]);

  // Add cleanup effect for error states
  useEffect(() => {
    return () => {
      setOfferCreationStatus(null);
      setOfferCreationMessage('');
      setShowCreateOffer(false);
      setShowMaxAmountWarning(false);
      setReactivateError(null);
    };
  }, []);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, []);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('offerCreationStatus changed:', offerCreationStatus);
    console.log('offerCreationMessage changed:', offerCreationMessage);
  }, [offerCreationStatus, offerCreationMessage]);

  useEffect(() => {
    console.log('errorTimeout changed:', errorTimeoutRef.current);
  }, [errorTimeoutRef.current]);

  // Add effect to handle tab changes
  useEffect(() => {
    console.log('Tab switching to:', activeTab);
    
    // Clear any existing error timeout using ref
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Reset all states without triggering validation
    setSelectedMethods([]);
    setOfferSelectedMethods([]);
    setOfferCreationStatus(null);
    setOfferCreationMessage('');
    setShowCreateOffer(false);
    setShowMaxAmountWarning(false);
    setReactivateError(null);
    setErrorTimeout(null);
    
    // Reset any validation states
    setCreateOfferData({
      type: activeTab,
      price: '3.2',
      minAmount: '',
      maxAmount: '',
      amount: '',
      description: '',
      orderLength: '1'
    });

    // Clear any existing error messages
    const errorElements = document.querySelectorAll('.text-red-500');
    errorElements.forEach(element => {
      element.textContent = '';
    });

    console.log('States after reset:');
    console.log('- offerCreationStatus:', offerCreationStatus);
    console.log('- offerCreationMessage:', offerCreationMessage);
    console.log('- errorTimeout:', errorTimeoutRef.current);
    console.log('- showCreateOffer:', showCreateOffer);
  }, [activeTab]);

  // Add cleanup effect with logging
  useEffect(() => {
    return () => {
      console.log('Cleanup effect running - Current states:');
      console.log('- offerCreationStatus:', offerCreationStatus);
      console.log('- offerCreationMessage:', offerCreationMessage);
      console.log('- errorTimeout:', errorTimeoutRef.current);
      if (errorTimeoutRef.current) {
        console.log('Clearing timeout in cleanup');
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, [errorTimeoutRef.current, offerCreationStatus, offerCreationMessage]);

  // Add this useEffect inside the P2P component to auto-clear the error
  useEffect(() => {
    if (offerCreationStatus === 'error') {
      const timer = setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [offerCreationStatus]);

  // Add console log to debug admin status
  useEffect(() => {
    console.log('Current user:', currentUser);
    console.log('Is admin:', isAdmin);
  }, [currentUser, isAdmin]);

  return (
    <>
      {showKycOverlay && (
        <KYCOverlay 
          status={kycStatus}
          rejectionReason={rejectionReason}
        />
      )}
      <div className={`${isDark ? '' : 'bg-[#f4f8ff]'} h-full min-h-screen`}>
        {/* Enhanced Interactive Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary Gradient Layer */}
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5' : 'bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-pink-200/40'} backdrop-blur-3xl`} />

          {/* Animated Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute top-1/4 -left-1/4 w-1/2 h-1/2 ${isDark ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent' : 'bg-gradient-to-r from-blue-400/40 via-purple-400/40 to-transparent'} rounded-full blur-3xl`}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 ${isDark ? 'bg-gradient-to-l from-purple-500/10 via-pink-500/10 to-transparent' : 'bg-gradient-to-l from-purple-400/40 via-pink-400/40 to-transparent'} rounded-full blur-3xl`}
          />

          {/* Floating Particles */}
          <motion.div
            animate={{
              y: [-20, 20, -20],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute top-1/3 left-1/4 w-2 h-2 ${isDark ? 'bg-blue-400/30' : 'bg-blue-600/50'} rounded-full blur-sm`}
          />
          <motion.div
            animate={{
              y: [20, -20, 20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute bottom-1/3 right-1/4 w-3 h-3 ${isDark ? 'bg-purple-400/30' : 'bg-purple-600/50'} rounded-full blur-sm`}
          />

          {/* Subtle Grid Pattern */}
          <div className={`${isDark ? 'bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px)]'} bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]`} />
        </div>

        <div className="flex gap-6 relative z-10">
          {/* Payment Methods Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 flex-shrink-0 mt-24"
          >
            <div className={`sticky top-24 ${isDark
                ? 'bg-gray-900/10 backdrop-blur-md border border-gray-800/50 rounded-xl shadow-lg'
                : 'bg-white border border-gray-300 rounded-xl shadow-lg'} overflow-visible`}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('p2p.paymentMethods')}</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>{t('p2p.selectPaymentMethods')}</p>
              </div>
              <div className="p-4 space-y-3">
                {paymentMethods.map((method) => (
                  <motion.button
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id)}
                    className={`w-full p-4 rounded-xl border ${selectedMethods.includes(method.id)
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : isDark 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                      } transition-all group relative overflow-hidden`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${selectedMethods.includes(method.id)
                        ? 'bg-blue-500/20'
                        : (isDark ? 'bg-white/5' : 'bg-gray-200')
                      } flex items-center justify-center`}>
                      <method.icon className={`w-5 h-5 ${selectedMethods.includes(method.id)
                          ? 'text-blue-400'
                          : (isDark ? 'text-gray-400' : 'text-gray-700')
                        }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(`p2p.paymentMethodNames.${method.id}`, method.name)}</span>
                        {method.isPopular && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                            {t('p2p.popular')}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{t(`p2p.paymentMethodDescriptions.${method.id}`, method.description)}</p>
                      <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t(`p2p.processingTime.${method.id}`, method.processingTime)}
                        </span>
                        <span>{t('p2p.fee', { fee: method.fee })}</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              {selectedMethods.length > 0 && (
                <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setSelectedMethods([])}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg ${isDark ? 'text-gray-400' : 'text-gray-700'} transition-colors text-sm`}
                  >
                    {t('p2p.clearSelection')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col items-start text-left">
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} drop-shadow-lg`}>{t('p2p.title')}</h1>
                <p className={`${isDark ? 'text-white' : 'text-gray-700'} drop-shadow mt-2`}>{t('p2p.subtitle')}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleProfileClick}
                  className={`px-6 py-3 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-blue-100/90 hover:bg-blue-200 border-blue-300'} backdrop-blur-xl border rounded-xl transition-all flex items-center gap-2 group`}
                >
                  <User className={`w-5 h-5 ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-blue-700 group-hover:text-blue-900'} transition-colors`} />
                  <span className={`${isDark ? 'text-gray-400 group-hover:text-white' : 'text-blue-700 group-hover:text-blue-900'} transition-colors`}>{t('common.viewProfile')}</span>
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      toast.error(t('p2p.errors.createOffer'));
                      navigate('/login');
                      return;
                    }
                    if (checkingProfile) {
                      toast.error(t('p2p.errors.checkingProfile'));
                      return;
                    }
                    if (!hasProfile) {
                      setShowProfileSetup(true);
                      return;
                    }
                    // Reset all states when opening the modal
                    setShowCreateOffer(true);
                    setOfferSelectedMethods([]);
                    setOfferCreationStatus(null);
                    setOfferCreationMessage('');
                    setCreateOfferData({
                      type: 'buy',
                      price: '3.2',
                      minAmount: '',
                      maxAmount: '',
                      amount: '',
                      description: '',
                      orderLength: '1'
                    });
                    if (errorTimeoutRef.current) {
                      clearTimeout(errorTimeoutRef.current);
                      errorTimeoutRef.current = null;
                    }
                  }}
                  className={`px-6 py-3 ${isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' : 'bg-green-100/90 hover:bg-green-200 border-green-300'} backdrop-blur-xl border rounded-xl transition-all flex items-center gap-2 group`}
                >
                  <Plus className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-green-700 group-hover:text-green-900'} group-hover:rotate-90 transition-transform`} />
                  <span className={`${isDark ? 'text-blue-400' : 'text-green-700 group-hover:text-green-900'}`}>{t('p2p.createOffer')}</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  activeTab === 'buy'
                    ? (isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-200 border-green-400')
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-100/90 border-blue-300 hover:bg-blue-200'} border scale-105`}
              >
                <DollarSign className={`w-5 h-5 ${activeTab === 'buy' ? 'text-green-600' : isDark ? 'text-gray-400' : 'text-blue-700'}`} />
                <span className={activeTab === 'buy' ? 'text-green-600' : isDark ? 'text-gray-400' : 'text-blue-700'}>{t('p2p.buy')}</span>
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  activeTab === 'sell'
                    ? (isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-200 border-red-400')
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-100/90 border-blue-300 hover:bg-blue-200'} border scale-105`}
              >
                <Wallet className={`w-5 h-5 ${activeTab === 'sell' ? 'text-red-600' : isDark ? 'text-gray-400' : 'text-blue-700'}`} />
                <span className={activeTab === 'sell' ? 'text-red-600' : isDark ? 'text-gray-400' : 'text-blue-700'}>{t('p2p.sell')}</span>
              </button>
            </div>

            {/* View Mode Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  viewMode === 'all'
                    ? (isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-200 border-blue-400')
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-100/90 border-blue-300 hover:bg-blue-200'} border scale-105`}
              >
                <span className={viewMode === 'all' ? 'text-blue-700' : isDark ? 'text-gray-400' : 'text-blue-700'}>{t('p2p.allOffers')}</span>
              </button>
              <button
                onClick={() => setViewMode('active')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  viewMode === 'active'
                    ? (isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-200 border-green-400')
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-100/90 border-blue-300 hover:bg-blue-200'} border scale-105`}
              >
                <span className={viewMode === 'active' ? 'text-green-700' : isDark ? 'text-gray-400' : 'text-blue-700'}>{t('p2p.myOffers')}</span>
              </button>
              <button
                onClick={() => setViewMode('open')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  viewMode === 'open'
                    ? (isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-200 border-yellow-400')
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-blue-100/90 border-blue-300 hover:bg-blue-200'} border scale-105`}
              >
                <span className={viewMode === 'open' ? 'text-yellow-700' : isDark ? 'text-gray-400' : 'text-blue-700'}>{t('p2p.myOrders')}</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('p2p.search')}
                    className={`w-full pl-12 pr-4 py-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors ${isDark ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                  />
                </div>
              </div>
            </div>

            {/* Offers List */}
            <div className="space-y-6">
              {viewMode === 'open' ? (
                // Show open orders
                userOrders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-6 ${isDark ? 'bg-white/5' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-xl backdrop-blur-xl hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all group`}
                  >
                    <div className="flex items-start gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {order.amount} USDT
                            </div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>
                              {t('p2p.order.price')}: {order.price} TND
                            </div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                              {t('p2p.order.total')}: {order.total} TND
                            </div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-2`}>
                              {t('p2p.order.tradingWith')}:{' '}
                              <span 
                                onClick={() => {
                                  const partnerId = order.buyer?._id === currentUser?._id ? 
                                    order.seller?._id : 
                                    order.buyer?._id;
                                  if (partnerId) {
                                    navigate(`/p2p/${partnerId}`);
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"
                              >
                                {order.buyer?._id === currentUser?._id ? 
                                  (order.seller?.nickname || order.seller?.username || t('p2p.order.unknownSeller')) : 
                                  (order.buyer?.nickname || order.buyer?.username || t('p2p.order.unknownBuyer'))}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('p2p.order.status')}</div>
                            <div className={`text-sm font-medium ${order.status === 'pending' ? 'text-yellow-400' :
                              order.status === 'paid' ? 'text-blue-400' :
                              order.status === 'completed' ? 'text-green-400' :
                              order.status === 'cancelled' ? 'text-red-400' :
                              order.status === 'disputed' ? 'text-orange-400' :
                              isDark ? 'text-gray-400' : 'text-gray-700'
                            }`}>
                              {t(`p2p.order.status.${order.status}`)}
                            </div>
                            {order.status === 'pending' && (
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>
                                {t('p2p.order.timeRemaining')}: {orderTimers[order._id] || calculateRemainingTime(order)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            {t('p2p.order.paymentMethod')}: {t(`p2p.paymentMethodNames.${order.paymentMethod}`, paymentMethods.find(pm => pm.id === order.paymentMethod)?.name || order.paymentMethod)}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setActiveOrder(order);
                                setShowChat(true);
                              }}
                              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-all"
                            >
                              {t('p2p.order.chat')}
                            </button>

                            {/* Order Actions */}
                            {order.status === 'pending' && order.buyer?._id === currentUser?._id && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForAction(order);
                                  setShowPaymentVerification(true);
                                }}
                                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                              >
                                {t('p2p.order.verifyPayment')}
                              </button>
                            )}

                            {order.status === 'paid' && order.seller?._id === currentUser?._id && (
                              <button
                                onClick={() => handleReleaseFunds(order._id)}
                                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                              >
                                {t('p2p.order.releaseFunds')}
                              </button>
                            )}

                            {['pending', 'paid'].includes(order.status) && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForAction(order);
                                  setShowDisputeModal(true);
                                }}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                              >
                                {t('p2p.order.fileDispute')}
                              </button>
                            )}

                            {/* Only show Cancel button for the buyer and only if the order is pending */}
                            {order.status === 'pending' && order.buyer?._id === currentUser?._id && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                              >
                                {t('p2p.order.cancelOrder')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Show offers
                filteredOffers.map((offer, index) => (
                  <motion.div
                    key={offer._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-6 ${isDark ? 'bg-white/5' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-xl backdrop-blur-xl hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all group`}
                  >
                    <div className="flex items-start gap-6">
                      {/* User Info */}
                      <div className="w-64">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'} flex items-center justify-center overflow-hidden`}>
                            {offer.seller?.profilePicture ? (
                              <img 
                                src={offer.seller.profilePicture} 
                                alt={offer.seller?.nickname || offer.seller?.username || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-700'}`} />
                            )}
                          </div>
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2 cursor-pointer hover:underline`}
                              onClick={() => navigate(`/p2p/${offer.seller?._id || offer.seller}`)}
                            >
                              {offer.seller?.nickname || offer.seller?.username || 'Unknown User'}
                              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            </div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('p2p.orderCount', { count: offer.orders || 0 })}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            <ThumbsUp className="w-4 h-4 text-green-400" />
                            <span>{t('p2p.completionRate', { rate: offer.completionRate || 100 })}</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>{t('p2p.minResponse', { min: offer.response || '0' })}</span>
                          </div>
                          {currentUser && offer.seller?._id !== currentUser._id && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.post(`/api/p2p/block/${offer.seller._id}`);
                                    toast.success('User blocked successfully');
                                    // Refresh offers to remove blocked user's offers
                                    const response = await axios.get('/api/p2p/offers', {
                                      params: { type: activeTab }
                                    });
                                    setOffers(response.data);
                                  } catch (error) {
                                    console.error('Error blocking user:', error);
                                    toast.error(error.response?.data?.message || 'Failed to block user');
                                  }
                                }}
                                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-sm transition-all"
                              >
                                Block
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Please select a reason for reporting:\n1. Scam\n2. Inappropriate Behavior\n3. Fake Offers\n4. Payment Issues\n5. Other');
                                  if (!reason) return;

                                  const details = prompt('Please provide more details about your report:');
                                  if (!details) return;

                                  axios.post(`/api/p2p/report/${offer.seller._id}`, {
                                    reason: ['scam', 'inappropriate_behavior', 'fake_offers', 'payment_issues', 'other'][parseInt(reason) - 1],
                                    details
                                  })
                                    .then(() => {
                                      toast.success('User reported successfully');
                                    })
                                    .catch(error => {
                                      console.error('Error reporting user:', error);
                                      toast.error(error.response?.data?.message || 'Failed to report user');
                                    });
                                }}
                                className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm transition-all"
                              >
                                Report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{offer.price} TND</div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>
                              {t('p2p.available')}: {offer.amount} USDT
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{t('p2p.limits')}</div>
                            <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{offer.minAmount} - {offer.maxAmount} TND</div>
                          </div>
                        </div>

                        <div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.paymentMethods')}</div>
                          <div className="flex flex-wrap gap-2">
                            {offer.paymentMethods.map((method, i) => (
                              <span
                                key={i}
                                className={`px-4 py-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'} rounded-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                              >
                                {t(`p2p.paymentMethodNames.${method}`, paymentMethods.find(pm => pm.id === method)?.name || method)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3">
                        {currentUser && offer.seller?._id === currentUser._id ? (
                          <div className="flex flex-col gap-3">
                            {offer.status === 'inactive' ? (
                              <>
                                <button
                                  onClick={() => handleEditOffer(offer)}
                                  className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-blue-400">{t('p2p.offer.editAndReactivate')}</span>
                                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                                </button>
                                <button
                                  onClick={() => handleOfferStatusChange(offer._id, 'active')}
                                  className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-green-400">{t('p2p.offer.reactivate')}</span>
                                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOfferStatusChange(offer._id, 'inactive')}
                                  className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-yellow-400">{t('p2p.offer.deactivate')}</span>
                                  <X className="w-5 h-5 text-yellow-400" />
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.delete(`/api/p2p/offers/${offer._id}`);
                                      setOffers(prev => prev.filter(o => o._id !== offer._id));
                                      toast.success(t('p2p.success.deleteOffer'));
                                    } catch (error) {
                                      console.error('Error deleting offer:', error);
                                      toast.error(error.response?.data?.message || t('p2p.errors.deleteOffer'));
                                    }
                                  }}
                                  className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-red-400">{t('p2p.offer.delete')}</span>
                                  <X className="w-5 h-5 text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                toast.error(t('p2p.errors.createOrder'));
                                navigate('/login');
                                return;
                              }
                              if (!hasProfile) {
                                toast.error(t('p2p.errors.profileRequired'));
                                setShowProfileSetup(true);
                                return;
                              }
                              handleTransaction(offer);
                            }}
                            className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2"
                          >
                            <span className="text-blue-400">{activeTab === 'buy' ? t('p2p.buy') : t('p2p.sell')}</span>
                            <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Offer Modal */}
      <AnimatePresence>
        {showCreateOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateOffer(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-2xl ${isDark ? 'bg-gray-900/50 border-white/10' : 'bg-white border-gray-300 shadow-2xl'} border rounded-xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh]`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-300'} flex items-center justify-between`}>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('p2p.createOfferModal.title')}</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>{t('p2p.createOfferModal.subtitle')}</p>
                </div>
                {!offerCreationStatus && (
                  <button
                    onClick={() => setShowCreateOffer(false)}
                    className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreateOfferSubmit}>
                {offerCreationStatus ? (
                  <div className="p-6 text-center">
                    {console.log('Rendering error animation with status:', offerCreationStatus, 'message:', offerCreationMessage, 'timeout ref:', errorTimeoutRef.current)}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${offerCreationStatus === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                      {offerCreationStatus === 'success' ? (
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                      )}
                    </div>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {offerCreationStatus === 'success' ? 'Offer Created Successfully' : 'Error Creating Offer'}
                    </h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{offerCreationMessage}</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {/* Form content */}
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                          {t('p2p.createOfferModal.offerType')}
                        </label>
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setCreateOfferData({ ...createOfferData, type: 'buy' });
                              setOfferCreationStatus(null);
                              setOfferCreationMessage('');
                              if (errorTimeoutRef.current) {
                                clearTimeout(errorTimeoutRef.current);
                                errorTimeoutRef.current = null;
                              }
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                              createOfferData.type === 'buy'
                                ? (isDark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-100 border border-green-300 text-green-700')
                                : isDark
                                  ? 'bg-white/5 border border-white/10 text-gray-400'
                                  : 'bg-gray-100 border border-gray-300 text-gray-600'
                            }`}
                          >
                            <DollarSign className="w-5 h-5" />
                            {t('p2p.buyUSDT')}
                          </button>
                          <button
                            onClick={() => {
                              setCreateOfferData({ ...createOfferData, type: 'sell' });
                              setOfferCreationStatus(null);
                              setOfferCreationMessage('');
                              if (errorTimeoutRef.current) {
                                clearTimeout(errorTimeoutRef.current);
                                errorTimeoutRef.current = null;
                              }
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                              createOfferData.type === 'sell'
                                ? (isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-100 border border-red-300 text-red-700')
                                : isDark
                                  ? 'bg-white/5 border border-white/10 text-gray-400'
                                  : 'bg-gray-100 border border-gray-300 text-gray-600'
                            }`}
                          >
                            <Wallet className="w-5 h-5" />
                            {t('p2p.sellUSDT')}
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.price')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="price"
                            value={createOfferData.price}
                            onChange={handleCreateOfferChange}
                            placeholder={t('p2p.createOfferModal.pricePlaceholder')}
                            className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-300'} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors ${isDark ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                            required
                          />
                        </div>
                      </div>

                      {/* Limits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.minAmount')}</label>
                          <input
                            type="text"
                            name="minAmount"
                            value={createOfferData.minAmount}
                            onChange={handleCreateOfferChange}
                            placeholder={t('p2p.createOfferModal.minAmountPlaceholder')}
                            className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border' : 'bg-gray-100 border'} ${isDark ? (createOfferData.minAmount && parseFloat(createOfferData.minAmount) < 10 ? 'border-red-500/50' : 'border-white/10') : (createOfferData.minAmount && parseFloat(createOfferData.minAmount) < 10 ? 'border-red-500' : 'border-gray-300')} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors`}
                            required
                          />
                          {createOfferData.minAmount && parseFloat(createOfferData.minAmount) < 10 && (
                            <p className="mt-1 text-sm text-red-500">{t('p2p.createOfferModal.minAmountError')}</p>
                          )}
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.maxAmount')}</label>
                          <input
                            type="text"
                            name="maxAmount"
                            value={createOfferData.maxAmount}
                            onChange={handleCreateOfferChange}
                            placeholder={t('p2p.createOfferModal.maxAmountPlaceholder')}
                            className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border' : 'bg-gray-100 border'} ${isDark ? ((createOfferData.maxAmount && createOfferData.minAmount && parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) || (createOfferData.maxAmount && parseFloat(createOfferData.maxAmount) > 20000) ? 'border-red-500/50' : 'border-white/10') : ((createOfferData.maxAmount && createOfferData.minAmount && parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) || (createOfferData.maxAmount && parseFloat(createOfferData.maxAmount) > 20000) ? 'border-red-500' : 'border-gray-300')} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors`}
                            required
                          />
                          {createOfferData.maxAmount && createOfferData.minAmount && parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount) && (
                            <p className="mt-1 text-sm text-red-500">{t('p2p.createOfferModal.maxAmountError')}</p>
                          )}
                          {createOfferData.maxAmount && parseFloat(createOfferData.maxAmount) > 20000 && (
                            <p className="mt-1 text-sm text-red-500">{t('p2p.createOfferModal.maxAmountLimitError')}</p>
                          )}
                        </div>
                      </div>

                      {/* Order Length */}
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.orderLength')}</label>
                        <select
                          name="orderLength"
                          value={createOfferData.orderLength}
                          onChange={handleCreateOfferChange}
                          className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl focus:outline-none transition-colors ${isDark ? 'bg-white/5 border border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-100 border border-gray-300 text-gray-900 focus:border-blue-400'}`}
                          required
                        >
                          {orderLengthOptions.map(option => (
                            <option 
                              key={option.value} 
                              value={option.value}
                              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                            >
                              {t(`p2p.createOfferModal.orderLengthOptions.${option.value}`, option.label)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Available Amount */}
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.availableAmount')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="amount"
                            value={createOfferData.amount}
                            onChange={handleCreateOfferChange}
                            placeholder={t('p2p.createOfferModal.availableAmountPlaceholder')}
                            className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-300'} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors`}
                            required
                          />
                          {createOfferData.type === 'sell' && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-sm text-gray-400">
                                {t('p2p.createOfferModal.available')}: {walletData?.globalUsdtBalance || 0} USDT
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAmount = walletData?.globalUsdtBalance || 0;
                                  setCreateOfferData(prev => ({ ...prev, amount: maxAmount.toString() }));
                                }}
                                className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm transition-all"
                              >
                                {t('p2p.createOfferModal.max')}
                              </button>
                            </div>
                          )}
                          {createOfferData.type === 'buy' && offerSelectedMethods.includes('tnd_wallet') && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-sm text-gray-400">
                                {t('p2p.createOfferModal.max')}: {((currentUser?.walletBalance || 0) / (parseFloat(createOfferData.price) || 1)).toFixed(2)} USDT
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAmount = (currentUser?.walletBalance || 0) / (parseFloat(createOfferData.price) || 1);
                                  setCreateOfferData(prev => ({ ...prev, amount: maxAmount.toFixed(2) }));
                                }}
                                className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm transition-all"
                              >
                                {t('p2p.createOfferModal.max')}
                              </button>
                            </div>
                          )}
                        </div>
                        {createOfferData.amount && createOfferData.price && (
                          <div className="mt-2 text-sm text-gray-500">
                            {t('p2p.createOfferModal.equivalent')}: {calculateTNDEquivalent(createOfferData.amount, createOfferData.price)} TND
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.description')}</label>
                        <textarea
                          name="description"
                          value={createOfferData.description}
                          onChange={handleCreateOfferChange}
                          placeholder={t('p2p.createOfferModal.descriptionPlaceholder')}
                          className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-300'} rounded-xl backdrop-blur-xl focus:outline-none ${isDark ? 'focus:border-blue-500/50' : 'focus:border-blue-400'} transition-colors`}
                          rows={3}
                        />
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-2`}>{t('p2p.createOfferModal.paymentMethods')}</label>
                        <div className="grid grid-cols-2 gap-3">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setOfferSelectedMethods(prev => prev.includes(method.id) ? prev.filter(id => id !== method.id) : [...prev, method.id])}
                              className={`p-4 rounded-xl border ${offerSelectedMethods.includes(method.id)
                                  ? (isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-100 border-blue-300')
                                  : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-300 hover:bg-gray-200')
                                } transition-all`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${offerSelectedMethods.includes(method.id)
                                    ? (isDark ? 'bg-blue-500/20' : 'bg-blue-200')
                                    : (isDark ? 'bg-white/5' : 'bg-gray-200')
                                  } flex items-center justify-center`}>
                                  <method.icon className={`w-4 h-4 ${offerSelectedMethods.includes(method.id)
                                      ? (isDark ? 'text-blue-400' : 'text-blue-700')
                                      : (isDark ? 'text-gray-400' : 'text-gray-700')
                                    }`} />
                                </div>
                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{t(`p2p.paymentMethodNames.${method.id}`, method.name)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={
                          !createOfferData.minAmount ||
                          parseFloat(createOfferData.minAmount) < 10 ||
                          !createOfferData.maxAmount ||
                          parseFloat(createOfferData.maxAmount) > 20000 ||
                          (createOfferData.minAmount && createOfferData.maxAmount && 
                           parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) ||
                          !createOfferData.price ||
                          !createOfferData.amount ||
                          offerSelectedMethods.length === 0
                        }
                        className={`w-full py-4 ${
                          !createOfferData.minAmount ||
                          parseFloat(createOfferData.minAmount) < 10 ||
                          !createOfferData.maxAmount ||
                          parseFloat(createOfferData.maxAmount) > 20000 ||
                          (createOfferData.minAmount && createOfferData.maxAmount && 
                           parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) ||
                          !createOfferData.price ||
                          !createOfferData.amount ||
                          offerSelectedMethods.length === 0
                            ? (isDark ? 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed')
                            : (isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700')
                        } border rounded-xl transition-all font-medium`}
                      >
                        {t('p2p.createOfferModal.submit')}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div className="w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden">
              <div className="bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Order Chat</h2>
                    <p className="text-sm text-gray-400">
                      Order #{activeOrder._id.slice(-6)} - {activeOrder.amount} USDT
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Show payment verification button for buyers when order is pending */}
                    {activeOrder?.status === 'pending' && activeOrder?.buyer?._id === currentUser?._id && (
                      <button
                        onClick={() => {
                          if (!activeOrder?._id) {
                            toast.error('Order ID is missing');
                            return;
                          }
                          setSelectedOrderId(activeOrder._id);
                          setShowPaymentVerification(true);
                        }}
                        className="px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 font-semibold transition-all"
                      >
                        {t('p2p.order.verifyPayment')}
                      </button>
                    )}
                    {/* Show release funds button for sellers when order is paid */}
                    {activeOrder.status === 'paid' && activeOrder.seller?._id === currentUser?._id && (
                      <button
                        onClick={() => handleReleaseFunds(activeOrder._id)}
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                      >
                        Release Funds
                      </button>
                    )}
                    {/* Only show dispute for buyer after payment proof is submitted */}
                    {activeOrder.status === 'paid' && activeOrder.buyer?._id === currentUser?._id && (
                      <button
                        onClick={() => {
                          setSelectedOrderForAction(activeOrder);
                          setShowDisputeModal(true);
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                      >
                        File Dispute
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowChat(false);
                        setActiveOrder(null);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Chat Component */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <P2PChat
                    order={activeOrder}
                    currentUser={currentUser}
                    onClose={() => {
                      setShowChat(false);
                      setActiveOrder(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Setup Modal */}
      <AnimatePresence>
        {showProfileSetup && (
          <P2PProfileSetup
            onClose={() => {
              setShowProfileSetup(false);
              // Refresh profile status
              if (currentUser?._id) {
                const checkProfile = async () => {
                  try {
                    const response = await axios.get(`/api/p2p/profile/${currentUser._id}`);
                    setHasProfile(true);
                  } catch (error) {
                    if (error.response?.status === 404) {
                      setHasProfile(false);
                    } else {
                      console.error('Error checking profile:', error);
                      toast.error('Failed to check profile status');
                    }
                  }
                };
                checkProfile();
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransactionModal && selectedOffer && transactionStep !== 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTransactionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">{t('p2p.transactionModal.title')}</h2>
                <p className="text-sm text-gray-400 mt-1">{t('p2p.transactionModal.subtitle')}</p>
              </div>
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('p2p.transactionModal.amount')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={e => {
                      const newAmount = e.target.value;
                      setAmount(newAmount);
                      if (selectedOffer) {
                        const tndEquivalent = (parseFloat(newAmount) * parseFloat(selectedOffer.price)).toFixed(2);
                        setTndAmountInput(tndEquivalent);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder={t('p2p.transactionModal.amountPlaceholder')}
                  />
                  {amount && selectedOffer && (
                    <div className="mt-2 text-sm text-gray-400">
                      {t('p2p.transactionModal.equivalent')}: {(parseFloat(amount) * parseFloat(selectedOffer.price)).toFixed(2)} TND
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('p2p.transactionModal.equivalentinTND')}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={tndAmountInput}
                    onChange={e => {
                      setTndAmountInput(e.target.value);
                      // Also update USDT amount if possible
                      if (selectedOffer && e.target.value && !isNaN(parseFloat(e.target.value))) {
                        const usdt = parseFloat(e.target.value) / parseFloat(selectedOffer.price);
                        setAmount(usdt ? usdt.toFixed(6) : '');
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Enter TND amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{t('p2p.transactionModal.paymentMethod')}</label>
                  <select
                    value={modalSelectedPaymentMethod}
                    onChange={e => setModalSelectedPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="" className="bg-gray-800 text-gray-400">{t('p2p.transactionModal.selectPaymentMethod')}</option>
                    {selectedOffer.paymentMethods.map(method => {
                      // Find the payment method object for fallback
                      const pm = paymentMethods.find(pm => pm.id === method);
                      // Try translation, fallback to pm.name or method id
                      const label = t(`p2p.paymentMethodNames.${method}`);
                      const displayLabel = label.startsWith('p2p.paymentMethodNames.') ? (pm ? pm.name : method) : label;
                      return (
                        <option key={method} value={method} className="bg-gray-800 text-white">
                          {displayLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition font-medium"
                    disabled={transactionStep === 2}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmTransaction}
                    className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={!amount || !tndAmountInput || !modalSelectedPaymentMethod || transactionStep === 2}
                  >
                    {t('p2p.transactionModal.confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {transactionStep === 2 && (
          <ActionLoader isLoading={true} />
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && selectedOrderForAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDisputeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-md ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-xl backdrop-blur-xl overflow-hidden`}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>File Dispute</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Report an issue with this order</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Reason</label>
                  <select
                    className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl focus:outline-none transition-colors ${isDark ? 'bg-white/5 border border-white/10 text-white focus:border-blue-500/50' : 'bg-gray-100 border border-gray-300 text-gray-900 focus:border-blue-400'}`}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    value={disputeReason}
                  >
                    <option value="" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>Select a reason</option>
                    <option value="payment_not_received" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>Payment Not Received</option>
                    <option value="wrong_amount" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>Wrong Amount</option>
                    <option value="scam" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>Suspected Scam</option>
                    <option value="other" className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>Other</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Details</label>
                  <textarea
                    className={`w-full px-4 py-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors`}
                    rows={4}
                    placeholder="Please provide more details about the issue..."
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    value={disputeDetails}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDisputeModal(false);
                      setDisputeReason('');
                      setDisputeDetails('');
                    }}
                    className={`flex-1 px-4 py-3 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'} border rounded-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (disputeReason && disputeDetails) {
                        handleDispute(selectedOrderForAction._id, disputeReason, disputeDetails);
                      } else {
                        toast.error('Please provide both reason and details');
                      }
                    }}
                    className={`flex-1 px-4 py-3 ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'} border rounded-xl transition-all`}
                  >
                    Submit Dispute
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add Status Animation */}
      <AnimatePresence>
        {showStatusAnimation && (
          <OrderStatusAnimation
            status={statusAnimationType}
            onComplete={() => {
              setShowStatusAnimation(false);
              setStatusAnimationType(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add the animation component */}
      <AnimatePresence>
        {showDuplicateOrderAnimation && (
          <DuplicateOrderAnimation onClose={() => setShowDuplicateOrderAnimation(false)} />
        )}
      </AnimatePresence>

      {/* Add Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirmation && (
          <CancelConfirmation
            onConfirm={confirmCancelOrder}
            onClose={() => {
              setShowCancelConfirmation(false);
              setOrderToCancel(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Release Confirmation Modal */}
      <AnimatePresence>
        {showReleaseConfirmation && (
          <ReleaseConfirmation
            onConfirm={confirmReleaseFunds}
            onClose={() => setShowReleaseConfirmation(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Error Animation for Offer Creation */}
      <AnimatePresence>
        {offerCreationStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed top-8 left-1/2 z-[9999] -translate-x-1/2 flex flex-col items-center"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Error Creating Offer</h3>
              <p className="text-gray-400">{offerCreationMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Disputes button for admins */}
      {isAdmin && (
        <motion.button
          onClick={() => setShowDisputes(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-6 right-6 ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'} border rounded-xl p-4 transition-all flex items-center gap-2 shadow-lg cursor-pointer z-50`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span>Disputes</span>
        </motion.button>
      )}

      {/* Add Disputes Modal */}
      <AnimatePresence>
        {showDisputes && (
          <DisputesModal 
            onClose={() => setShowDisputes(false)} 
            setActiveOrder={setActiveOrder}
            setShowChat={setShowChat}
          />
        )}
      </AnimatePresence>

      {/* Dispute Success Animation */}
      <AnimatePresence>
        {showDisputeAnimation && (
          <DisputeAnimation 
            status={disputeAnimationStatus} 
            onClose={() => {
              setShowDisputeAnimation(false);
              setDisputeAnimationStatus(null);
            }} 
          />
        )}
      </AnimatePresence>

      {showPaymentVerification && selectedOrderId && (
        <PaymentVerificationModal
          onClose={() => {
            setShowPaymentVerification(false);
            setSelectedOrderId(null);
          }}
          onConfirm={handlePaymentVerification}
          orderId={selectedOrderId}
          setMessages={setMessages}
        />
      )}
    </>
  );
};

export default P2P;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { Search, Filter, ChevronDown, X, Send, Clock, CheckCircle, AlertTriangle, Shield, DollarSign, CreditCard, Ban as Bank, Wallet, ArrowRight, Plus, MessageSquare, Star, ThumbsUp, User, ArrowUpRight, Building2, Smartphone, Cast as Cash } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const P2P = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
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
  const [transactionStep, setTransactionStep] = useState(1);
  const navigate = useNavigate();

  // Background animation
  const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }));
  const bind = useDrag(({ movement: [mx, my] }) => {
    set({ xy: [mx, my] });
  });

  const messages = [
    { id: 1, type: 'seller', content: "Hello! I see you're interested in buying USDT.", time: '2:30 PM' },
    { id: 2, type: 'buyer', content: 'Yes, I\'d like to buy 500 USDT.', time: '2:31 PM' },
    { id: 3, type: 'seller', content: 'Great! I can process that for you. Please confirm the amount and rate.', time: '2:32 PM' }
  ];

  const offers = [
    {
      id: 1,
      user: 'TradePro',
      price: '3.25',
      available: '25,000',
      limits: '500-5,000',
      paymentMethods: ['Bank Transfer', 'Flouci', 'D17'],
      completionRate: '98%',
      orders: '2.5k+',
      response: '< 5 min'
    },
    {
      id: 2,
      user: 'CryptoKing',
      price: '3.27',
      available: '15,000',
      limits: '1,000-10,000',
      paymentMethods: ['Bank Transfer', 'Postepay'],
      completionRate: '99%',
      orders: '1.2k+',
      response: '< 10 min'
    },
    {
      id: 3,
      user: 'BitcoinTrader',
      price: '3.24',
      available: '50,000',
      limits: '1,000-20,000',
      paymentMethods: ['Bank Transfer', 'Flouci', 'D17', 'Postepay'],
      completionRate: '97%',
      orders: '3.8k+',
      response: '< 3 min'
    },
    {
      id: 4,
      user: 'CryptoElite',
      price: '3.26',
      available: '30,000',
      limits: '2,000-15,000',
      paymentMethods: ['Bank Transfer', 'Flouci', 'Postepay'],
      completionRate: '99%',
      orders: '1.5k+',
      response: '< 8 min'
    }
  ];

  const paymentMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Bank,
      description: 'Transfer directly to bank account',
      processingTime: '1-24 hours',
      fee: '0-1%',
      isPopular: true
    },
    {
      id: 'flouci',
      name: 'Flouci',
      icon: CreditCard,
      description: 'Pay with Flouci app',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'd17',
      name: 'D17',
      icon: CreditCard,
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
    }
  ];

  const [selectedMethods, setSelectedMethods] = useState([]);

  const togglePaymentMethod = (methodId) => {
    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTransaction = (offer) => {
    setSelectedOffer(offer);
    setShowTransactionModal(true);
    setTransactionStep(1);
  };

  const handleConfirmTransaction = () => {
    setTransactionStep(2);
    // Simulate processing
    setTimeout(() => {
      setTransactionStep(3);
    }, 2000);
  };

  return (
    <>
      <div className="h-full">
        {/* Enhanced Interactive Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-3xl" />
          
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
            className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl"
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
            className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-l from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl"
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
            className="absolute top-1/3 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full blur-sm"
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
            className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-400/30 rounded-full blur-sm"
          />

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        </div>
        
        <div className="flex gap-6">
          {/* Payment Methods Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 flex-shrink-0 mt-24"
          >
            <div className={`sticky top-24 ${
              isDark 
                ? 'bg-gray-900/10 backdrop-blur-md border border-gray-800/50 rounded-xl shadow-lg' 
                : 'bg-white/0 border border-gray-200/50 rounded-xl shadow-lg'
            } overflow-visible`}>
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Payment Methods</h2>
                <p className="text-sm text-gray-400 mt-1">Select your preferred payment methods</p>
              </div>

              <div className="p-4 space-y-3">
                {paymentMethods.map((method) => (
                  <motion.button
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id)}
                    className={`w-full p-4 rounded-xl border ${
                      selectedMethods.includes(method.id)
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } transition-all group relative overflow-hidden`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${
                        selectedMethods.includes(method.id)
                          ? 'bg-blue-500/20'
                          : 'bg-white/5'
                      } flex items-center justify-center`}>
                        <method.icon className={`w-5 h-5 ${
                          selectedMethods.includes(method.id)
                            ? 'text-blue-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{method.name}</span>
                          {method.isPopular && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{method.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {method.processingTime}
                          </span>
                          <span>Fee: {method.fee}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedMethods.length > 0 && (
                <div className="p-4 border-t border-gray-800">
                  <button
                    onClick={() => setSelectedMethods([])}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors text-sm"
                  >
                    Clear Selection
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
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">P2P Trading</h1>
                <p className="text-white drop-shadow mt-2">Buy and sell USDT with other users</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/p2p/${currentUser?.id}`)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl transition-all flex items-center gap-2 group"
                >
                  <User className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-gray-400 group-hover:text-white transition-colors">My P2P Profile</span>
                </button>
                <button
                  onClick={() => setShowCreateOffer(true)}
                  className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-xl border border-blue-500/20 rounded-xl transition-all flex items-center gap-2 group"
                >
                  <Plus className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform" />
                  <span className="text-blue-400">Create Offer</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  activeTab === 'buy'
                    ? 'bg-green-500/10 border border-green-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <DollarSign className={`w-5 h-5 ${activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}`} />
                <span className={activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}>Buy USDT</span>
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                  activeTab === 'sell'
                    ? 'bg-red-500/10 border border-red-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Wallet className={`w-5 h-5 ${activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}`} />
                <span className={activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}>Sell USDT</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by price, payment method, or user..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Filters</span>
                </button>
              </div>
            </div>

            {/* Offers List */}
            <div className="space-y-6">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start gap-6">
                    {/* User Info */}
                    <div className="w-64">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2 cursor-pointer hover:underline"
                            onClick={() => navigate(`/p2p/${offer.id}`)}
                          >
                            {offer.user}
                            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          </div>
                          <div className="text-gray-400">{offer.orders} orders</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                          <span>{offer.completionRate} completion</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{offer.response} response</span>
                        </div>
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold text-white">{offer.price} TND</div>
                          <div className="text-gray-400 mt-1">
                            Available: {offer.available} USDT
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400">Limits</div>
                          <div className="text-white">{offer.limits} TND</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 mb-2">Payment Methods</div>
                        <div className="flex flex-wrap gap-2">
                          {offer.paymentMethods.map((method, i) => (
                            <span
                              key={i}
                              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setShowChat(true)}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group"
                      >
                        <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-gray-400 group-hover:text-white transition-colors">Chat</span>
                      </button>
                      <button 
                        onClick={() => handleTransaction(offer)}
                        className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <span className="text-blue-400">{activeTab === 'buy' ? 'Buy' : 'Sell'}</span>
                        <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
              className="w-full max-w-2xl bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Create New Offer</h2>
                  <p className="text-sm text-gray-400 mt-1">Set up your USDT trading offer</p>
                </div>
                <button
                  onClick={() => setShowCreateOffer(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Offer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Offer Type</label>
                  <div className="flex gap-4">
                    <button
                      className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                        activeTab === 'buy'
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('buy')}
                    >
                      <DollarSign className={`w-5 h-5 ${activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}`} />
                      <span className={activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}>Buy USDT</span>
                    </button>
                    <button
                      className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                        activeTab === 'sell'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setActiveTab('sell')}
                    >
                      <Wallet className={`w-5 h-5 ${activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}`} />
                      <span className={activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}>Sell USDT</span>
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price (TND)</label>
                  <input
                    type="number"
                    placeholder="Enter price per USDT"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Amount (TND)</label>
                    <input
                      type="number"
                      placeholder="Min amount"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Amount (TND)</label>
                    <input
                      type="number"
                      placeholder="Max amount"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Available Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Available Amount (USDT)</label>
                  <input
                    type="number"
                    placeholder="Enter available amount"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Payment Methods</label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => togglePaymentMethod(method.id)}
                        className={`p-4 rounded-xl border ${
                          selectedMethods.includes(method.id)
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        } transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${
                            selectedMethods.includes(method.id)
                              ? 'bg-blue-500/20'
                              : 'bg-white/5'
                          } flex items-center justify-center`}>
                            <method.icon className={`w-4 h-4 ${
                              selectedMethods.includes(method.id)
                                ? 'text-blue-400'
                                : 'text-gray-400'
                            }`} />
                          </div>
                          <span className="text-white">{method.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all text-blue-400 font-medium"
                >
                  Create Offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">TradePro</div>
                    <div className="text-green-400 text-sm">Online</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'buyer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-xl p-4 ${
                      msg.type === 'buyer'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <div className="text-white">{msg.content}</div>
                      <div className="text-sm text-gray-400 mt-2">{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-blue-500/50 transition-colors placeholder-gray-500"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className={`px-4 rounded-xl transition-all flex items-center ${
                      message.trim()
                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                        : 'bg-white/5 border border-white/10 text-gray-400'
                    }`}
                  >
                    <Send className="w-5 h-5" />
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

export default P2P;
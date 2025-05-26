import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { Search, Filter, ChevronDown, X, Send, Clock, CheckCircle, AlertTriangle, Shield, DollarSign, CreditCard, Ban as Bank, Wallet, ArrowRight, Plus, MessageSquare, Star, ThumbsUp, User, ArrowUpRight, Building2, Smartphone, Cast as Cash } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import P2PChat from '../components/P2PChat';
import P2PProfileSetup from '../components/P2PProfileSetup';
import { io } from 'socket.io-client';

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
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState(null);
  const socketRef = useRef(null);
  const [createOfferData, setCreateOfferData] = useState({
    type: 'buy',
    price: '',
    minAmount: '',
    maxAmount: '',
    amount: '',
    description: ''
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/p2p/offers');
        setOffers(response.data);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to fetch offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (currentUser) {
      socketRef.current = io(import.meta.env.VITE_API_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current.on('orderUpdate', (updatedOrder) => {
        if (activeOrder && activeOrder._id === updatedOrder._id) {
          setActiveOrder(updatedOrder);
        }
      });

      socketRef.current.on('newMessage', (message) => {
        if (activeOrder && message.orderId === activeOrder._id) {
          setMessages(prev => [...prev, message]);
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [currentUser, activeOrder]);

  // Check if user has P2P profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!currentUser?.id) {
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await axios.get(`/api/p2p/profile/${currentUser.id}`);
        setHasProfile(true);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error checking profile:', error);
        }
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [currentUser]);

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
    },
    {
      id: 'phone_balance',
      name: 'Phone Balance',
      icon: Smartphone,
      description: 'Pay using your phone credit',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'western_union',
      name: 'Western Union',
      icon: Building2,
      description: 'Send money via Western Union',
      processingTime: '1-2 hours',
      fee: '1-2%',
      isPopular: false
    },
    {
      id: 'moneygram',
      name: 'MoneyGram',
      icon: Building2,
      description: 'Send money via MoneyGram',
      processingTime: '1-2 hours',
      fee: '1-2%',
      isPopular: false
    }
  ];

  const togglePaymentMethod = (methodId) => {
    setSelectedMethods(prev => 
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

  const handleTransaction = async (offer) => {
    if (!currentUser) {
      toast.error('Please login to start a transaction');
      navigate('/login');
      return;
    }
    setSelectedOffer(offer);
    setShowTransactionModal(true);
    setTransactionStep(1);
  };

  const handleConfirmTransaction = async () => {
    if (!amount || !selectedOffer) return;

    try {
      setTransactionStep(2);
      
      // Create the order
      const response = await axios.post('/api/p2p/orders', {
        offerId: selectedOffer._id,
        amount: parseFloat(amount),
        paymentMethod: selectedMethods[0] // For now, just use the first selected method
      });

      if (response.data) {
        setTransactionStep(3);
        setActiveOrder(response.data);
        setShowChat(true);
        toast.success('Order created successfully');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
      setTransactionStep(1);
    }
  };

  const handleCreateOfferChange = (e) => {
    const { name, value } = e.target;
    setCreateOfferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateOfferSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please login to create an offer');
      navigate('/login');
      return;
    }

    if (!hasProfile) {
      toast.error('Please set up your P2P profile first');
      navigate(`/p2p/${currentUser.id}`);
      return;
    }

    if (selectedMethods.length === 0) {
      toast.error('Please select at least one payment method');
      return;
    }

    try {
      const response = await axios.post('/api/p2p/offers', {
        ...createOfferData,
        paymentMethods: selectedMethods
      });
      
      setOffers(prev => [response.data, ...prev]);
      setShowCreateOffer(false);
      setCreateOfferData({
        type: 'buy',
        price: '',
        minAmount: '',
        maxAmount: '',
        amount: '',
        description: ''
      });
      setSelectedMethods([]);
      toast.success('Offer created successfully');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(error.response?.data?.message || 'Failed to create offer');
    }
  };

  const handleCreateOfferClick = () => {
    if (!currentUser) {
      toast.error('Please login to create an offer');
      navigate('/login');
      return;
    }

    if (!hasProfile) {
      setShowProfileSetup(true);
      return;
    }

    setShowCreateOffer(true);
  };

  // Filter offers based on search term and selected payment methods
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !searchTerm || 
      (offer.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPaymentMethods = selectedMethods.length === 0 || 
      selectedMethods.some(method => offer.paymentMethods?.includes(method));
    return matchesSearch && matchesPaymentMethods;
  });

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
                  onClick={handleCreateOfferClick}
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
              {filteredOffers.map((offer, index) => (
                <motion.div
                  key={offer._id}
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
                            onClick={() => navigate(`/p2p/${offer.seller?._id || offer.seller}`)}
                          >
                            {offer.seller?.username || 'Unknown User'}
                            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          </div>
                          <div className="text-gray-400">{offer.orders || 0} orders</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                          <span>{offer.completionRate || 100}% completion</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{offer.response || '0 min'} response</span>
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
              <form onSubmit={handleCreateOfferSubmit} className="p-6 space-y-6">
                {/* Offer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Offer Type</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                        createOfferData.type === 'buy'
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setCreateOfferData(prev => ({ ...prev, type: 'buy' }))}
                    >
                      <DollarSign className={`w-5 h-5 ${createOfferData.type === 'buy' ? 'text-green-400' : 'text-gray-400'}`} />
                      <span className={createOfferData.type === 'buy' ? 'text-green-400' : 'text-gray-400'}>Buy USDT</span>
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${
                        createOfferData.type === 'sell'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setCreateOfferData(prev => ({ ...prev, type: 'sell' }))}
                    >
                      <Wallet className={`w-5 h-5 ${createOfferData.type === 'sell' ? 'text-red-400' : 'text-gray-400'}`} />
                      <span className={createOfferData.type === 'sell' ? 'text-red-400' : 'text-gray-400'}>Sell USDT</span>
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Price (TND)</label>
                  <input
                    type="number"
                    name="price"
                    value={createOfferData.price}
                    onChange={handleCreateOfferChange}
                    placeholder="Enter price per USDT"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Amount (TND)</label>
                    <input
                      type="number"
                      name="minAmount"
                      value={createOfferData.minAmount}
                      onChange={handleCreateOfferChange}
                      placeholder="Min amount"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Amount (TND)</label>
                    <input
                      type="number"
                      name="maxAmount"
                      value={createOfferData.maxAmount}
                      onChange={handleCreateOfferChange}
                      placeholder="Max amount"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Available Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Available Amount (USDT)</label>
                  <input
                    type="number"
                    name="amount"
                    value={createOfferData.amount}
                    onChange={handleCreateOfferChange}
                    placeholder="Enter available amount"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={createOfferData.description}
                    onChange={handleCreateOfferChange}
                    placeholder="Add any additional details about your offer..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                    rows={3}
                  />
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Payment Methods</label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
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
                  type="submit"
                  className="w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all text-blue-400 font-medium"
                >
                  Create Offer
                </button>
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
            <div className="w-full max-w-2xl h-[600px] rounded-xl overflow-hidden">
              <P2PChat
                orderId={activeOrder._id}
                onClose={() => {
                  setShowChat(false);
                  setActiveOrder(null);
                }}
              />
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
              const checkProfile = async () => {
                try {
                  const response = await axios.get(`/api/p2p/profile/${currentUser.id}`);
                  setHasProfile(true);
                } catch (error) {
                  setHasProfile(false);
                }
              };
              checkProfile();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default P2P;
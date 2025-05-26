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
  const [tndAmountInput, setTndAmountInput] = useState(''); // New state for TND input
  const [showMaxAmountWarning, setShowMaxAmountWarning] = useState(false); // New state for max amount warning
  const [transactionStep, setTransactionStep] = useState(1);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'active', 'open'
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
    orderLength: '1' // Default to 1 hour
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [duplicateOrderMessage, setDuplicateOrderMessage] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerCreationStatus, setOfferCreationStatus] = useState(null); // 'success', 'error', or null
  const [offerCreationMessage, setOfferCreationMessage] = useState('');

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
        const response = await axios.get('/api/p2p/offers', {
          params: {
            type: activeTab // Pass the active tab as the type parameter
          }
        });
        setOffers(response.data);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to fetch offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [activeTab]); // Add activeTab as a dependency

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
        // Also update the order in the userOrders list if it exists there
        setUserOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
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

  const checkExistingOrder = (offerId) => {
    return userOrders.some(order =>
      order.offerId === offerId &&
      ['pending', 'in_progress'].includes(order.status)
    );
  };

  const handleTransaction = async (offer) => {
    if (!currentUser) {
      toast.error('Please login to start a transaction');
      navigate('/login');
      return;
    }

    if (checkExistingOrder(offer._id)) {
      setDuplicateOrderMessage(true);
      setTimeout(() => setDuplicateOrderMessage(false), 3000);
      return;
    }

    setSelectedOffer(offer);
    setShowTransactionModal(true);
    setTransactionStep(1);
    setAmount(''); // Clear USDT amount
    setTndAmountInput(''); // Clear TND input
    setShowMaxAmountWarning(false); // Hide warning when opening modal
    setSelectedMethods([]);
  };

  const handleConfirmTransaction = async () => {
    // Use tndAmountInput for validation against offer limits
    const enteredTndAmount = parseFloat(tndAmountInput);

    if (!enteredTndAmount || !selectedMethods[0] || !selectedOffer) return;

    try {
      setTransactionStep(2);

      // Remove minimum amount validation
      // if (enteredTndAmount < selectedOffer.minAmount) {
      //   toast.error(`Amount must be at least ${selectedOffer.minAmount} TND`);
      //   setTransactionStep(1);
      //   return;
      // }

      // Keep maximum amount validation
      if (enteredTndAmount > selectedOffer.maxAmount) {
        toast.error(`Amount cannot exceed ${selectedOffer.maxAmount} TND`);
        setTransactionStep(1);
        return;
      }

      // Check for insufficient wallet balance if using 'tnd_wallet'
      if (selectedMethods[0] === 'tnd_wallet') {
        if (enteredTndAmount > (currentUser?.walletBalance || 0)) {
          toast.error(`Insufficient balance. You need ${enteredTndAmount.toFixed(2)} TND but have ${(currentUser?.walletBalance || 0).toFixed(2)} TND`);
          setTransactionStep(1);
          return;
        }
      }

      // Create the order using the calculated USDT amount
      const response = await axios.post('/api/p2p/orders', {
        offerId: selectedOffer._id,
        amount: parseFloat(amount), // Use the mirrored USDT amount
        paymentMethod: selectedMethods[0]
      });

      if (response.data) {
        setTransactionStep(3);
        setActiveOrder(response.data);
        setShowChat(true);
        toast.success('Order created successfully');
        // Add the newly created order to the userOrders list
        setUserOrders(prevOrders => [response.data, ...prevOrders]);

        // Update the offer in the offers list with new limits
        if (response.data.offer) {
          setOffers(prevOffers =>
            prevOffers.map(offer =>
              offer._id === response.data.offer._id ? response.data.offer : offer
            )
          );
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
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

    // Handle price changes
    if (name === 'price') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setCreateOfferData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }

    // Handle min/max amount changes
    if (name === 'minAmount' || name === 'maxAmount') {
      // Allow empty value or any number input
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // First update the value
        setCreateOfferData(prev => ({
          ...prev,
          [name]: value
        }));

        // Then validate if there's a value
        if (value !== '') {
          const numValue = parseFloat(value);

          // Validate min amount
          if (name === 'minAmount' && numValue < 10) {
            toast.error('Minimum amount must be at least 10 TND');
          }

          // Validate max amount
          if (name === 'maxAmount' && numValue > 20000) {
            toast.error('Maximum amount cannot exceed 20000 TND');
          }

          // Validate min/max relationship
          if (name === 'minAmount' && createOfferData.maxAmount && numValue >= parseFloat(createOfferData.maxAmount)) {
            toast.error('Minimum amount must be less than maximum amount');
          }
          if (name === 'maxAmount' && createOfferData.minAmount && numValue <= parseFloat(createOfferData.minAmount)) {
            toast.error('Maximum amount must be greater than minimum amount');
          }
        }
      }
      return;
    }

    // Handle amount changes
    if (name === 'amount') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // If selling, validate against available balance
        if (createOfferData.type === 'sell' && value !== '') {
          const availableBalance = walletData?.globalUsdtBalance || 0;
          const inputAmount = parseFloat(value);
          if (inputAmount > availableBalance) {
            toast.error(`Amount cannot exceed your available balance of ${availableBalance} USDT`);
            return;
          }
        }
        // If buying with TND wallet, validate against TND balance
        if (createOfferData.type === 'buy' && selectedMethods.includes('tnd_wallet') && value !== '') {
          const tndBalance = currentUser?.walletBalance || 0;
          const price = parseFloat(createOfferData.price) || 0;
          const maxUsdtAmount = tndBalance / price;
          const inputAmount = parseFloat(value);
          if (inputAmount > maxUsdtAmount) {
            toast.error(`Amount cannot exceed your TND wallet balance equivalent of ${maxUsdtAmount.toFixed(2)} USDT`);
            return;
          }
        }
        setCreateOfferData(prev => ({
          ...prev,
          [name]: value
        }));
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
    
    if (!currentUser) {
      setOfferCreationStatus('error');
      setOfferCreationMessage('Please login to create an offer');
      setTimeout(() => {
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

    if (selectedMethods.length === 0) {
      setOfferCreationStatus('error');
      setOfferCreationMessage('Please select at least one payment method');
      setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
      return;
    }

    // Check for existing active offers of the same type
    const existingActiveOffer = offers.find(offer => 
      offer.seller?._id === currentUser._id && 
      offer.type === createOfferData.type && 
      offer.status === 'active'
    );

    if (existingActiveOffer && !editingOffer) {
      setOfferCreationStatus('error');
      setOfferCreationMessage(`You already have an active ${createOfferData.type} offer. Please deactivate it first.`);
      setTimeout(() => {
        setOfferCreationStatus(null);
        setOfferCreationMessage('');
      }, 2000);
      return;
    }

    // Add validation for selling amount
    if (createOfferData.type === 'sell') {
      const availableBalance = walletData?.globalUsdtBalance || 0;
      const offerAmount = parseFloat(createOfferData.amount);

      if (offerAmount > availableBalance) {
        setOfferCreationStatus('error');
        setOfferCreationMessage(`Insufficient USDT balance. Available: ${availableBalance} USDT`);
        setTimeout(() => {
          setOfferCreationStatus(null);
          setOfferCreationMessage('');
        }, 2000);
        return;
      }
    }

    // Add validation for buying with TND wallet
    if (createOfferData.type === 'buy' && selectedMethods.includes('tnd_wallet')) {
      const tndBalance = currentUser?.walletBalance || 0;
      const price = parseFloat(createOfferData.price) || 0;
      const maxUsdtAmount = tndBalance / price;
      const offerAmount = parseFloat(createOfferData.amount);

      if (offerAmount > maxUsdtAmount) {
        setOfferCreationStatus('error');
        setOfferCreationMessage(`Insufficient TND balance. Available: ${maxUsdtAmount.toFixed(2)} USDT`);
        setTimeout(() => {
          setOfferCreationStatus(null);
          setOfferCreationMessage('');
        }, 2000);
        return;
      }
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
        setTimeout(() => {
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
          ...createOfferData,
          maxAmount: adjustedMaxAmount.toString(),
          paymentMethods: selectedMethods,
          status: 'active' // Reactivate the offer when editing
        });
        setOfferCreationStatus('success');
        setOfferCreationMessage('Offer updated successfully');
      } else {
        // Create new offer
        response = await axios.post('/api/p2p/offers', {
          ...createOfferData,
          maxAmount: adjustedMaxAmount.toString(),
          paymentMethods: selectedMethods
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
        setSelectedMethods([]);
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
      
      // Wait for 2 seconds to show the error animation
      setTimeout(() => {
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
        // Filter orders to only include pending and paid orders
        const openOrders = response.data.filter(order =>
          ['pending', 'paid'].includes(order.status)
        );
        setUserOrders(openOrders);
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
      const response = await axios.put(`/api/p2p/offers/${offerId}`, {
        status: newStatus
      });
      setOffers(prev => prev.map(offer =>
        offer._id === offerId ? response.data : offer
      ));
      toast.success(`Offer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast.error(error.response?.data?.message || 'Failed to update offer status');
    }
  };

  // Add this function to handle offer editing
  const handleEditOffer = (offer) => {
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
    setSelectedMethods(offer.paymentMethods);
    setShowCreateOffer(true);
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
            <div className={`sticky top-24 ${isDark
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
                    className={`w-full p-4 rounded-xl border ${selectedMethods.includes(method.id)
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } transition-all group relative overflow-hidden`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${selectedMethods.includes(method.id)
                          ? 'bg-blue-500/20'
                          : 'bg-white/5'
                        } flex items-center justify-center`}>
                        <method.icon className={`w-5 h-5 ${selectedMethods.includes(method.id)
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
                  onClick={handleProfileClick}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl transition-all flex items-center gap-2 group"
                >
                  <User className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-gray-400 group-hover:text-white transition-colors">My P2P Profile</span>
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      toast.error('Please login to create an offer');
                      navigate('/login');
                      return;
                    }

                    if (checkingProfile) {
                      toast.error('Please wait while we check your profile status');
                      return;
                    }

                    if (!hasProfile) {
                      setShowProfileSetup(true);
                      return;
                    }

                    setShowCreateOffer(true);
                  }}
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
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${activeTab === 'buy'
                    ? 'bg-green-500/10 border border-green-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <DollarSign className={`w-5 h-5 ${activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}`} />
                <span className={activeTab === 'buy' ? 'text-green-400' : 'text-gray-400'}>Buy USDT</span>
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 py-4 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${activeTab === 'sell'
                    ? 'bg-red-500/10 border border-red-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <Wallet className={`w-5 h-5 ${activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}`} />
                <span className={activeTab === 'sell' ? 'text-red-400' : 'text-gray-400'}>Sell USDT</span>
              </button>
            </div>

            {/* View Mode Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${viewMode === 'all'
                    ? 'bg-blue-500/10 border border-blue-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <span className={viewMode === 'all' ? 'text-blue-400' : 'text-gray-400'}>All Offers</span>
              </button>
              <button
                onClick={() => setViewMode('active')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${viewMode === 'active'
                    ? 'bg-green-500/10 border border-green-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <span className={viewMode === 'active' ? 'text-green-400' : 'text-gray-400'}>My Active Offers</span>
              </button>
              <button
                onClick={() => setViewMode('open')}
                className={`flex-1 py-3 px-6 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${viewMode === 'open'
                    ? 'bg-yellow-500/10 border border-yellow-500/20 scale-105'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <span className={viewMode === 'open' ? 'text-yellow-400' : 'text-gray-400'}>Open Orders</span>
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
                    className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-start gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {order.amount} USDT
                            </div>
                            <div className="text-gray-400 mt-1">
                              Price: {order.price} TND
                            </div>
                            <div className="text-gray-400">
                              Total: {order.total} TND
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-400">Status</div>
                            <div className={`text-sm font-medium ${order.status === 'pending' ? 'text-yellow-400' :
                                order.status === 'paid' ? 'text-blue-400' :
                                  order.status === 'completed' ? 'text-green-400' :
                                    order.status === 'cancelled' ? 'text-red-400' :
                                      order.status === 'disputed' ? 'text-orange-400' :
                                        'text-gray-400'
                              }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                            {/* Show timer only if status is pending */}
                            {order.status === 'pending' && (
                              <div className="text-sm text-gray-400 mt-1">
                                Time remaining: {orderTimers[order._id] || calculateRemainingTime(order)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-gray-400">
                            Payment Method: {paymentMethods.find(pm => pm.id === order.paymentMethod)?.name || order.paymentMethod}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setActiveOrder(order);
                                setShowChat(true);
                              }}
                              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 transition-all"
                            >
                              Chat
                            </button>
                            {order.status === 'pending' && order.seller?._id?.toString() === currentUser?._id?.toString() && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.put(`/api/p2p/orders/${order._id}`, {
                                      status: 'paid'
                                    });
                                    // Update the order in the state directly
                                    setUserOrders(prevOrders =>
                                      prevOrders.map(o =>
                                        o._id === order._id ? { ...o, status: 'paid' } : o
                                      )
                                    );
                                    toast.success('Order marked as paid');
                                  } catch (error) {
                                    console.error('Error updating order:', error);
                                    toast.error('Failed to update order status');
                                  }
                                }}
                                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                              >
                                Mark as Paid
                              </button>
                            )}
                            {order.status === 'paid' && order.buyer?._id?.toString() === currentUser?._id?.toString() && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.put(`/api/p2p/orders/${order._id}`, {
                                      status: 'completed'
                                    });
                                    // Update the order in the state directly
                                    setUserOrders(prevOrders =>
                                      prevOrders.map(o =>
                                        o._id === order._id ? { ...o, status: 'completed' } : o
                                      )
                                    );
                                    toast.success('Order completed');
                                  } catch (error) {
                                    console.error('Error updating order:', error);
                                    toast.error('Failed to complete order');
                                  }
                                }}
                                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all"
                              >
                                Complete Order
                              </button>
                            )}
                            {/* Only show cancel button to the buyer for sell orders and to the seller for buy orders */}
                            {((order.status === 'pending' || order.status === 'paid') &&
                              ((order.offer?.type === 'sell' && order.buyer?._id?.toString() === currentUser?._id?.toString()) ||
                                (order.offer?.type === 'buy' && order.seller?._id?.toString() === currentUser?._id?.toString()))) && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.put(`/api/p2p/orders/${order._id}`, {
                                        status: 'cancelled'
                                      });
                                      // Update the order in the state directly
                                      setUserOrders(prevOrders =>
                                        prevOrders.map(o =>
                                          o._id === order._id ? { ...o, status: 'cancelled' } : o
                                        )
                                      );
                                      toast.success('Order cancelled');
                                    } catch (error) {
                                      console.error('Error cancelling order', error);
                                      toast.error('Failed to cancel order');
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                                >
                                  Cancel
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
                              {offer.seller?.nickname || offer.seller?.username || 'Unknown User'}
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
                            <div className="text-3xl font-bold text-white">{offer.price} TND</div>
                            <div className="text-gray-400 mt-1">
                              Available: {offer.amount} USDT
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-400">Limits</div>
                            <div className="text-white">
                              {offer.minAmount} - {offer.maxAmount} TND
                            </div>
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
                                {paymentMethods.find(pm => pm.id === method)?.name || method}
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
                                  <span className="text-blue-400">Edit & Reactivate</span>
                                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                                </button>
                                <button
                                  onClick={() => handleOfferStatusChange(offer._id, 'active')}
                                  className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-green-400">Reactivate</span>
                                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOfferStatusChange(offer._id, 'inactive')}
                                  className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-yellow-400">Deactivate</span>
                                  <X className="w-5 h-5 text-yellow-400" />
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.delete(`/api/p2p/offers/${offer._id}`);
                                      setOffers(prev => prev.filter(o => o._id !== offer._id));
                                      toast.success('Offer deleted successfully');
                                    } catch (error) {
                                      console.error('Error deleting offer:', error);
                                      toast.error(error.response?.data?.message || 'Failed to delete offer');
                                    }
                                  }}
                                  className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
                                >
                                  <span className="text-red-400">Delete</span>
                                  <X className="w-5 h-5 text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                toast.error('Please login to start a transaction');
                                navigate('/login');
                                return;
                              }
                              if (!hasProfile) {
                                toast.error('Please set up your P2P profile first');
                                setShowProfileSetup(true);
                                return;
                              }
                              handleTransaction(offer);
                            }}
                            className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2"
                          >
                            <span className="text-blue-400">{activeTab === 'buy' ? 'Buy' : 'Sell'}</span>
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
              className="w-full max-w-2xl bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh]"
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
              {offerCreationStatus ? (
                <div className="p-8 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      offerCreationStatus === 'success' 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}
                  >
                    {offerCreationStatus === 'success' ? (
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    ) : (
                      <X className="w-10 h-10 text-red-400" />
                    )}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg font-medium ${
                      offerCreationStatus === 'success' 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}
                  >
                    {offerCreationMessage}
                  </motion.p>
                </div>
              ) : (
                <form onSubmit={handleCreateOfferSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  {/* Offer Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Offer Type</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${createOfferData.type === 'buy'
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
                        className={`flex-1 py-3 px-4 rounded-xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all ${createOfferData.type === 'sell'
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
                    <div className="relative">
                      <input
                        type="text"
                        name="price"
                        value={createOfferData.price}
                        onChange={handleCreateOfferChange}
                        placeholder="Enter price per USDT"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Amount (TND)</label>
                      <input
                        type="text"
                        name="minAmount"
                        value={createOfferData.minAmount}
                        onChange={handleCreateOfferChange}
                        placeholder="Min amount (min: 10 TND)"
                        className={`w-full px-4 py-3 bg-white/5 border ${
                          createOfferData.minAmount && parseFloat(createOfferData.minAmount) < 10
                            ? 'border-red-500/50'
                            : 'border-white/10'
                        } rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors`}
                        required
                      />
                      {createOfferData.minAmount && parseFloat(createOfferData.minAmount) < 10 && (
                        <p className="mt-1 text-sm text-red-400">Minimum amount must be at least 10 TND</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Amount (TND)</label>
                      <input
                        type="text"
                        name="maxAmount"
                        value={createOfferData.maxAmount}
                        onChange={handleCreateOfferChange}
                        placeholder="Max amount (max: 20000 TND)"
                        className={`w-full px-4 py-3 bg-white/5 border ${
                          (createOfferData.maxAmount && createOfferData.minAmount && 
                          parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) ||
                          (createOfferData.maxAmount && parseFloat(createOfferData.maxAmount) > 20000)
                            ? 'border-red-500/50'
                            : 'border-white/10'
                        } rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors`}
                        required
                      />
                      {createOfferData.maxAmount && createOfferData.minAmount && 
                       parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount) && (
                        <p className="mt-1 text-sm text-red-400">Maximum amount must be greater than minimum amount</p>
                      )}
                      {createOfferData.maxAmount && parseFloat(createOfferData.maxAmount) > 20000 && (
                        <p className="mt-1 text-sm text-red-400">Maximum amount cannot exceed 20000 TND</p>
                      )}
                    </div>
                  </div>

                  {/* Order Length */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Order Length</label>
                    <select
                      name="orderLength"
                      value={createOfferData.orderLength}
                      onChange={handleCreateOfferChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                      required
                    >
                      {orderLengthOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Available Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Available Amount (USDT)</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="amount"
                        value={createOfferData.amount}
                        onChange={handleCreateOfferChange}
                        placeholder="Enter available amount"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                        required
                      />
                      {createOfferData.type === 'sell' && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Available: {walletData?.globalUsdtBalance || 0} USDT
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const maxAmount = walletData?.globalUsdtBalance || 0;
                              setCreateOfferData(prev => ({ ...prev, amount: maxAmount.toString() }));
                            }}
                            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm transition-all"
                          >
                            MAX
                          </button>
                        </div>
                      )}
                      {createOfferData.type === 'buy' && selectedMethods.includes('tnd_wallet') && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Max: {((currentUser?.walletBalance || 0) / (parseFloat(createOfferData.price) || 1)).toFixed(2)} USDT
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const maxAmount = (currentUser?.walletBalance || 0) / (parseFloat(createOfferData.price) || 1);
                              setCreateOfferData(prev => ({ ...prev, amount: maxAmount.toFixed(2) }));
                            }}
                            className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm transition-all"
                          >
                            MAX
                          </button>
                        </div>
                      )}
                    </div>
                    {createOfferData.amount && createOfferData.price && (
                      <div className="mt-2 text-sm text-gray-400">
                        Equivalent: {calculateTNDEquivalent(createOfferData.amount, createOfferData.price)} TND
                      </div>
                    )}
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
                          className={`p-4 rounded-xl border ${selectedMethods.includes(method.id)
                              ? 'bg-blue-500/10 border-blue-500/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                            } transition-all`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${selectedMethods.includes(method.id)
                                ? 'bg-blue-500/20'
                                : 'bg-white/5'
                              } flex items-center justify-center`}>
                              <method.icon className={`w-4 h-4 ${selectedMethods.includes(method.id)
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
                    disabled={
                      !createOfferData.minAmount ||
                      parseFloat(createOfferData.minAmount) < 10 ||
                      !createOfferData.maxAmount ||
                      parseFloat(createOfferData.maxAmount) > 20000 ||
                      (createOfferData.minAmount && createOfferData.maxAmount && 
                       parseFloat(createOfferData.maxAmount) <= parseFloat(createOfferData.minAmount)) ||
                      !createOfferData.price ||
                      !createOfferData.amount ||
                      selectedMethods.length === 0
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
                      selectedMethods.length === 0
                        ? 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed'
                        : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
                    } border rounded-xl transition-all text-blue-400 font-medium`}
                  >
                    Create Offer
                  </button>
                </form>
              )}
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
        {showTransactionModal && selectedOffer && (
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
              className="w-full max-w-md bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Confirm Transaction</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {transactionStep === 1 ? 'Enter the amount you want to trade' :
                    transactionStep === 2 ? 'Confirm your transaction details' :
                      'Transaction in progress'}
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {transactionStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Amount (TND)</label>
                      <input
                        type="number"
                        value={tndAmountInput} // Bind to local state
                        onChange={(e) => {
                          const tndValue = e.target.value;
                          setTndAmountInput(tndValue); // Update local state immediately
                          const parsedTnd = parseFloat(tndValue);

                          // Check and set max amount warning
                          if (!isNaN(parsedTnd) && selectedOffer?.maxAmount && parsedTnd > selectedOffer.maxAmount) {
                            setShowMaxAmountWarning(true);
                          } else {
                            setShowMaxAmountWarning(false);
                          }

                          if (!isNaN(parsedTnd) && selectedOffer?.price) {
                            // Update mirrored USDT amount
                            setAmount((parsedTnd / selectedOffer.price).toFixed(6));
                          } else {
                            setAmount('');
                          }
                        }}
                        placeholder={`Enter amount (${selectedOffer.minAmount} - ${selectedOffer.maxAmount} TND)`}
                        className={`w-full px-4 py-3 bg-white/5 border ${showMaxAmountWarning ? 'border-red-500/50' : 'border-white/10'} rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors`}
                        // Removed min as per user request, keeping max for validation hint
                        max={selectedOffer.maxAmount}
                        step="0.01"
                      />

                      {/* Display max amount warning */}
                      {showMaxAmountWarning && (
                        <p className="mt-1 text-sm text-red-400">Amount cannot exceed the offer's maximum limit ({selectedOffer.maxAmount} TND)</p>
                      )}

                      {/* Add USDT input field */}
                      <label className="block text-sm font-medium text-gray-400 mb-2 mt-4">Amount (USDT)</label>
                      <input
                        type="number"
                        value={amount} // Bind to USDT amount state
                        onChange={(e) => {
                          const usdtValue = e.target.value;
                          setAmount(usdtValue); // Update USDT state immediately
                          const parsedUsdt = parseFloat(usdtValue);
                          if (!isNaN(parsedUsdt) && selectedOffer?.price) {
                            // Update mirrored TND input
                            const calculatedTnd = (parsedUsdt * selectedOffer.price);
                            setTndAmountInput(calculatedTnd.toFixed(2)); // Format TND display

                            // Check and set max amount warning based on calculated TND
                            if (selectedOffer?.maxAmount && calculatedTnd > selectedOffer.maxAmount) {
                              setShowMaxAmountWarning(true);
                            } else {
                              setShowMaxAmountWarning(false);
                            }

                          } else {
                            setTndAmountInput('');
                            setShowMaxAmountWarning(false);
                          }
                        }}
                        placeholder="Enter amount (USDT)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                        step="0.000001"
                      />

                      {/* Keep the equivalent display below the inputs */}
                      {amount && selectedOffer?.price && (
                        <div className="mt-2 text-sm text-gray-400">
                          Equivalent: {calculateTNDEquivalent(amount, selectedOffer.price)} TND
                        </div>
                      )}
                      {selectedMethods[0] === 'tnd_wallet' && amount && selectedOffer?.price && (
                        <div className="mt-2 text-sm">
                          {/* Use enteredTndAmount for balance check here as well */}
                          {parseFloat(tndAmountInput) > (currentUser?.walletBalance || 0) ? (
                            <span className="text-red-400">
                              Insufficient balance. You need {parseFloat(tndAmountInput).toFixed(2)} TND but have {(currentUser?.walletBalance || 0).toFixed(2)} TND
                            </span>
                          ) : (
                            <span className="text-green-400">
                              Available balance: {(currentUser?.walletBalance || 0).toFixed(2)} TND
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Payment Method</label>
                      <select
                        value={selectedMethods[0] || ''}
                        onChange={(e) => setSelectedMethods([e.target.value])}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors"
                      >
                        <option value="">Select a payment method</option>
                        {selectedOffer.paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {paymentMethods.find(pm => pm.id === method)?.name || method}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {transactionStep === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white">{amount} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">{selectedOffer.price} TND</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white">{calculateTNDEquivalent(amount, selectedOffer.price)} TND</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white">
                          {paymentMethods.find(pm => pm.id === selectedMethods[0])?.name || selectedMethods[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {transactionStep === 3 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Order Created Successfully</h3>
                    <p className="text-gray-400">You can now proceed with the payment</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {transactionStep === 1 && (
                    <>
                      <button
                        onClick={() => setShowTransactionModal(false)}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmTransaction}
                        disabled={
                          !tndAmountInput || // Check if TND input is empty
                          parseFloat(tndAmountInput) <= 0 || // Ensure TND amount is positive
                          parseFloat(tndAmountInput) > selectedOffer.maxAmount || // Max limit check
                          !selectedMethods[0] ||
                          (selectedMethods[0] === 'tnd_wallet' &&
                            parseFloat(tndAmountInput) > (currentUser?.walletBalance || 0))
                        }
                        className={`flex-1 px-4 py-3 ${!tndAmountInput ||
                            parseFloat(tndAmountInput) <= 0 ||
                            parseFloat(tndAmountInput) > selectedOffer.maxAmount ||
                            !selectedMethods[0] ||
                            (selectedMethods[0] === 'tnd_wallet' &&
                              parseFloat(tndAmountInput) > (currentUser?.walletBalance || 0))
                            ? 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed'
                            : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
                          } border rounded-xl transition-all text-blue-400`}
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {transactionStep === 2 && (
                    <>
                      <button
                        onClick={() => setTransactionStep(1)}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          setShowTransactionModal(false);
                          setShowChat(true);
                        }}
                        className="flex-1 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 transition-all"
                      >
                        Start Chat
                      </button>
                    </>
                  )}

                  {transactionStep === 3 && (
                    <button
                      onClick={() => {
                        setShowTransactionModal(false);
                        setShowChat(true);
                      }}
                      className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 transition-all"
                    >
                      Go to Chat
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add this before the closing div of the main container */}
      <AnimatePresence>
        {duplicateOrderMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <AlertTriangle size={20} />
            <span>You have to finish your order with this person before attempting to create a new one</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default P2P;
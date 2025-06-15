import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, CheckCircle, AlertTriangle, X, User, Shield, DollarSign, Wallet, ArrowRight, MessageSquare, Star, ThumbsUp, Image as ImageIcon, XCircle, Search, Filter, ChevronDown, Plus, ArrowUpRight, Building2, Smartphone, Cast as Cash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

// Add new CancelConfirmation component
const CancelConfirmation = ({ onConfirm, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-gray-900/50 border border-white/10 rounded-xl backdrop-blur-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">{t('p2p.chat.confirmations.cancelTitle')}</h3>
        <p className="text-gray-400 mb-6">{t('p2p.chat.confirmations.cancelMessage')}</p>
        <div className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            id="confirmCheckbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-blue-500"
          />
          <label htmlFor="confirmCheckbox" className="text-sm text-gray-400">
            {t('p2p.chat.confirmations.cancelCheckbox')}
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('p2p.chat.confirmations.close')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              confirmed
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                : 'bg-white/5 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('p2p.chat.confirmations.cancelOrder')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add new ReleaseConfirmation component
const ReleaseConfirmation = ({ onConfirm, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);
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
          {t('p2p.chat.confirmations.releaseTitle')}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6 text-center"
        >
          {t('p2p.chat.confirmations.releaseMessage')}
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
            {t('p2p.chat.confirmations.releaseCheckbox')}
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition-all"
          >
            {t('p2p.chat.confirmations.close')}
          </button>
          <button
            onClick={() => {
              if (confirmed) {
                onConfirm();
                onClose();
              } else {
                toast.error(t('p2p.chat.errors.releaseConfirm'));
              }
            }}
            className="flex-1 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!confirmed}
          >
            {t('p2p.chat.confirmations.releaseFunds')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const P2PChat = ({ order: propOrder, orderId, onClose, currentUser }) => {
  const { theme } = useTheme();
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useNotification();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const chatContainerRef = useRef(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const [currentOrder, setCurrentOrder] = useState(propOrder);
  const processedMessageIds = useRef(new Set());
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showReleaseConfirmation, setShowReleaseConfirmation] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser || !currentOrder) return;

    // Only initialize socket for active orders
    if (currentOrder?._id && currentOrder?.status !== 'completed' && currentOrder?.status !== 'cancelled') {
      // Function to initialize socket listeners
      const initializeSocketListeners = (socket) => {
        console.log('Joining order room:', currentOrder._id);
        // Join the order room
        socket.emit('join:room', currentOrder._id);

        // Listen for order status changes
        socket.on('orderStatusChanged', ({ orderId, status }) => {
          if (orderId === currentOrder._id) {
            // Update the currentOrder state with the new status
            setCurrentOrder(prevOrder => ({ ...prevOrder, status }));
            console.log('orderStatusChanged - Socket update status:', status);
          }
        });

        // Listen for new messages
        socket.on('newMessage', (message) => {
          console.log('Received new message in P2PChat:', message);
          if (message.orderId === currentOrder._id) {
            // Skip if this is our own message that we just sent
            if (message.sender._id === currentUser._id) {
              console.log('Skipping own message from socket');
              return;
            }
            const wasAdded = addMessage(message);
            if (wasAdded) {
              console.log('Successfully added new message to chat');
              // Scroll to bottom after adding new message
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }
          }
        });

        // Listen for notification events
        socket.on('notification:received', (data) => {
          console.log('Received notification in P2PChat:', data);
          if (data.notification.data?.orderId === currentOrder._id) {
            // If it's a message notification, we don't need to do anything
            // as the message will be handled by the newMessage event
            if (data.notification.type === 'transaction' && 
                data.notification.data?.type === 'new_message') {
              return;
            }
            // For other notifications, update the global state
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        });

        // Listen for notification updates
        socket.on('notification:update', (data) => {
          console.log('Received notification update in P2PChat:', data);
          if (data.orderId === currentOrder._id) {
            // Emit the notification to the notification service
            socket.emit('notification:received', {
              notification: {
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data,
                read: false,
                createdAt: new Date()
              }
            });
          }
        });
      };

      // Function to clean up socket listeners
      const cleanupSocketListeners = (socket) => {
        if (socket) {
          console.log('Cleaning up socket listeners');
          socket.off('orderStatusChanged');
          socket.off('newMessage');
          socket.off('notification:received');
          socket.off('notification:update');
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
    }
  }, [currentUser, currentOrder]);

  // Initialize order and messages
  useEffect(() => {
    // Initialize currentOrder with the prop value whenever the order prop changes
    if (propOrder) {
      console.log('Initializing from propOrder:', propOrder);
      setCurrentOrder(propOrder);
      // Initialize messages from propOrder if available
      if (propOrder.messages?.length > 0) {
        console.log('Setting initial messages from propOrder:', propOrder.messages.length);
        setMessages(propOrder.messages);
        // Initialize processedMessageIds
        processedMessageIds.current.clear();
        propOrder.messages.forEach(msg => {
          const messageKey = `${msg._id}-${msg.createdAt}`;
          processedMessageIds.current.add(messageKey);
        });
      }
      setLoading(false);
    } else if (orderId) {
      // If we have an orderId but no order prop, fetch the order
      const fetchOrder = async () => {
        try {
          const response = await axios.get(`/api/p2p/orders/${orderId}`);
          setCurrentOrder(response.data);
          if (response.data.messages?.length > 0) {
            console.log('Setting messages from API response:', response.data.messages.length);
            setMessages(response.data.messages);
            // Initialize processedMessageIds
            processedMessageIds.current.clear();
            response.data.messages.forEach(msg => {
              const messageKey = `${msg._id}-${msg.createdAt}`;
              processedMessageIds.current.add(messageKey);
            });
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          toast.error('Failed to load order');
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else {
      console.log('No order or orderId provided');
      setLoading(false);
    }
  }, [propOrder, orderId]);

  // Fetch messages when order changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentOrder?._id) {
        console.log('No currentOrder._id available, skipping fetch');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching messages for order:', currentOrder._id);
        
        // Fetch messages directly from the messages endpoint
        const messagesResponse = await axios.get(`/api/p2p/orders/${currentOrder._id}/messages`);
        console.log('Messages API Response:', messagesResponse.data);
        
        if (messagesResponse.data?.length > 0) {
          // Clear and rebuild the processed messages Set
          processedMessageIds.current.clear();
          messagesResponse.data.forEach(msg => {
            const messageKey = `${msg._id}-${msg.createdAt}`;
            processedMessageIds.current.add(messageKey);
          });
          
          // Set messages with the fetched data
          setMessages(messagesResponse.data);
          console.log('Loaded messages:', messagesResponse.data.length);
        } else {
          console.log('No messages found in response');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (currentOrder?._id) {
      fetchMessages();
    }
  }, [currentOrder?._id]);

  // Join order room when currentOrder changes
  useEffect(() => {
    if (socketRef.current && currentOrder?._id) {
      console.log('Joining order room on order change:', currentOrder._id);
      socketRef.current.emit('join:room', currentOrder._id);
    }
  }, [currentOrder?._id]);

  // Function to safely add a message
  const addMessage = (message) => {
    const messageKey = `${message._id}-${message.createdAt}`;
    if (processedMessageIds.current.has(messageKey)) {
      console.log('Message already processed:', messageKey);
      return false;
    }
    
    processedMessageIds.current.add(messageKey);
    setMessages(prev => [...prev, message]);
    return true;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(t('p2p.chat.errors.imageSize'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(t('p2p.chat.errors.imageType'));
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    if (!currentOrder) {
      toast.error(t('p2p.chat.errors.noActiveOrder'));
      return;
    }

    try {
      setUploading(true);
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('profilePicture', selectedImage);
        const uploadResponse = await axios.post('/api/p2p/upload-chat-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadResponse.data.url;
      }

      const response = await axios.post(`/api/p2p/orders/${currentOrder._id}/messages`, {
        content: newMessage,
        imageUrl
      });

      // Add the message to processedMessageIds before adding to state
      const messageKey = `${response.data._id}-${response.data.createdAt}`;
      processedMessageIds.current.add(messageKey);
      
      // Add the new message to the messages array
      setMessages(prev => [...prev, response.data]);
      
      // Emit socket event for real-time notification
      if (window.socket) {
        window.socket.emit('newMessage', {
          ...response.data,
          orderId: currentOrder._id,
          sender: {
            _id: currentUser._id,
            username: currentUser.username,
            profilePicture: currentUser.profilePicture
          }
        });
      }
      
      setNewMessage('');
      setSelectedImage(null);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('p2p.chat.errors.sendMessage'));
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    setTypingTimeout(setTimeout(() => setIsTyping(false), 2000));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'paid': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      case 'disputed': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const renderMessageContent = (message) => {
    return (
      <>
        {message.imageUrl && (
          <div className="mb-2">
            <img 
              src={message.imageUrl} 
              alt={t('p2p.chat.selectedImage')} 
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.imageUrl, '_blank')}
            />
          </div>
        )}
        {message.content && <p className="text-white">{message.content}</p>}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900/50 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">{t('p2p.chat.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900/50 backdrop-blur-xl">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('p2p.chat.orderNumber', { number: currentOrder?._id?.slice(-6) })}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${getStatusColor(currentOrder?.status)}`}>
                    {currentOrder?.status === 'pending' ? t('p2p.chat.status.pending') : 
                     currentOrder?.status === 'paid' ? t('p2p.chat.status.paid') :
                     currentOrder?.status === 'completed' ? t('p2p.chat.status.completed') :
                     currentOrder?.status === 'cancelled' ? t('p2p.chat.status.cancelled') : t('p2p.chat.status.disputed')}
                  </span>
                  <button
                    onClick={() => setShowOrderDetails(!showOrderDetails)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {showOrderDetails ? t('p2p.chat.hideDetails') : t('p2p.chat.showDetails')}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Only show cancel button for buyer and only when currentOrder is pending */}
              {currentOrder?.status === 'pending' && currentOrder?.buyer?._id === currentUser?._id && (
                <button
                  onClick={() => setShowCancelConfirmation(true)}
                  className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 font-semibold transition-all"
                >
                  {t('p2p.chat.cancelOrder')}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Order Details */}
          <AnimatePresence>
            {showOrderDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">{t('p2p.chat.amount')}</div>
                      <div className="text-white font-medium">{currentOrder?.amount} USDT</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{t('p2p.chat.price')}</div>
                      <div className="text-white font-medium">{currentOrder?.price} TND</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{t('p2p.chat.total')}</div>
                      <div className="text-white font-medium">{currentOrder?.total} TND</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">{t('p2p.chat.paymentMethod')}</div>
                      <div className="text-white font-medium">{currentOrder?.paymentMethod}</div>
                    </div>
                  </div>
                  {currentOrder?.status === 'paid' && currentOrder?.seller?._id === currentUser?._id && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm">
                      {t('p2p.chat.buyerPaymentProof')}
                    </div>
                  )}
                  {/* Seller Payment Info */}
                  <div className="mt-6">
                    <div className="text-sm text-gray-400 mb-1">{t('p2p.chat.sellerPaymentInfo')}</div>
                    <div className="text-white font-medium">
                      {/* Placeholder: Replace with real info if available */}
                      {t('p2p.chat.sellerPaymentInfoPlaceholder')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
            
            return (
              <div key={`${message._id}-${message.createdAt}-${index}`}>
                {showDate && (
                  <div className="flex justify-center mb-6">
                    <span className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-400">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] group relative`}
                  >
                    <div
                      className={`rounded-2xl p-4 ${
                        message.sender._id === currentUser._id
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-purple-500/10 border border-purple-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          message.sender._id === currentUser._id
                            ? 'bg-blue-500/20'
                            : 'bg-purple-500/20'
                        }`}>
                          <User className={`w-3 h-3 ${
                            message.sender._id === currentUser._id
                              ? 'text-blue-400'
                              : 'text-purple-400'
                          }`} />
                        </div>
                        <span className={`text-xs font-medium ${
                          message.sender._id === currentUser._id
                            ? 'text-blue-400'
                            : 'text-purple-400'
                        }`}>
                          {(() => {
                            console.log('Message sender:', message.sender);
                            const isCurrentUserSeller = currentOrder?.seller?._id === currentUser?._id;
                            const isMessageFromSeller = message.sender._id === currentOrder?.seller?._id;
                            
                            // First check if sender is admin
                            if (message.sender.role === 'admin' || message.sender.role === 'superadmin') {
                              return 'Admin';
                            }
                            
                            if (message.sender._id === currentUser._id) {
                              return isCurrentUserSeller ? t('p2p.chat.seller') : t('p2p.chat.buyer');
                            } else {
                              return isMessageFromSeller ? t('p2p.chat.seller') : t('p2p.chat.buyer');
                            }
                          })()}
                        </span>
                      </div>
                      {renderMessageContent(message)}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs ${
                          message.sender._id === currentUser._id
                            ? 'text-blue-400'
                            : 'text-purple-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </span>
                        {message.sender._id === currentUser._id && (
                          <CheckCircle className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="max-w-[70%]">
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10">
          {selectedImage && (
            <div className="mb-4 relative">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt={t('p2p.chat.selectedImage')} 
                className="max-h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={t('p2p.chat.typeMessage')}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl focus:outline-none focus:border-blue-500/50 transition-colors text-white placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || uploading}
              className={`p-3 rounded-xl transition-all ${
                (newMessage.trim() || selectedImage) && !uploading
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400'
                  : 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirmation && (
          <CancelConfirmation
            onConfirm={async () => {
              try {
                await axios.put(`/api/p2p/orders/${currentOrder._id}`, { status: 'cancelled' });
                // Emit socket event for real-time update using global socket
                window.socket.emit('notification:update', {
                  orderId: currentOrder._id,
                  type: 'transaction',
                  title: t('p2p.chat.messages.orderCancelled'),
                  message: t('p2p.chat.messages.orderCancelledWithId', { orderId: currentOrder._id.slice(-6) }),
                  data: {
                    orderId: currentOrder._id,
                    type: 'order_cancelled'
                  }
                });
                toast.success(t('p2p.chat.messages.orderCancelled'));
              } catch (error) {
                toast.error(t('p2p.chat.errors.cancelFailed'));
              }
            }}
            onClose={() => setShowCancelConfirmation(false)}
          />
        )}
      </AnimatePresence>

      {/* Add Release Confirmation Modal */}
      <AnimatePresence>
        {showReleaseConfirmation && (
          <ReleaseConfirmation
            onConfirm={async () => {
              try {
                await axios.put(`/api/p2p/orders/${currentOrder._id}`, { status: 'completed' });
                // Emit socket event for real-time update
                window.socket.emit('notification:update', {
                  orderId: currentOrder._id,
                  type: 'transaction',
                  title: t('p2p.chat.messages.fundsReleased'),
                  message: t('p2p.chat.messages.fundsReleasedWithId', { orderId: currentOrder._id.slice(-6) }),
                  data: {
                    orderId: currentOrder._id,
                    type: 'funds_released'
                  }
                });
                toast.success(t('p2p.chat.messages.fundsReleased'));
              } catch (error) {
                console.error('Error releasing funds:', error);
                toast.error(error.response?.data?.error || t('p2p.chat.errors.releaseFailed'));
              }
            }}
            onClose={() => setShowReleaseConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default P2PChat;
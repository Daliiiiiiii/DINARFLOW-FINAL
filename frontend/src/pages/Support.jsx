import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  User, 
  Bot,
  Plus,
  FileText,
  Paperclip,
  ChevronRight,
  Filter,
  CheckCheck,
  AlertTriangle,
  Book,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Mail
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ActionLoader from '../assets/animations/ActionLoader';
import api from '../lib/axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const Support = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected for support');
    });

    newSocket.on('support:message:received', (data) => {
      console.log('Received support message:', data);
      if (selectedTicket && data.ticket._id === selectedTicket._id) {
        setTicketMessages(prev => {
          // Check if message already exists
          const messageExists = prev.some(msg => 
            msg._id === data.message._id || 
            (msg.timestamp === data.message.timestamp && msg.content === data.message.content)
          );
          if (messageExists) return prev;
          return [...prev, data.message];
        });
      }
      // Refresh tickets list to update latest message
      fetchTickets();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedTicket?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [ticketMessages]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/support/tickets');
      setTickets(res.data);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTicket = async () => {
    setShowNewTicketModal(true);
  };

  const handleCreateTicket = async () => {
    if (!newTicketTitle.trim() || !message.trim()) return;
    try {
      setIsLoading(true);
      const res = await api.post('/api/support/tickets', { subject: newTicketTitle, message });
      setShowNewTicketModal(false);
      setNewTicketTitle('');
      setMessage('');
      await fetchTickets();
      setSelectedTicket(res.data);
      setActiveTab('tickets');
      fetchTicketMessages(res.data._id);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      setIsLoading(true);
      await api.patch(`/api/support/tickets/${selectedTicket._id}/status`, { status: 'closed' });
      await fetchTickets();
      setSelectedTicket(null);
      setTicketMessages([]);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/support/tickets/${ticketId}`);
      setTicketMessages(res.data.messages || []);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('tickets');
    fetchTicketMessages(ticket._id);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket) return;
    
    // Create optimistic message
    const optimisticMessage = {
      _id: Date.now().toString(), // Temporary ID
      content: message.trim(),
      type: 'user',
      timestamp: new Date().toISOString()
    };

    // Update UI optimistically
    setTicketMessages(prev => [...prev, optimisticMessage]);
    setMessage('');

    try {
      setIsLoading(true);
      const response = await api.post(`/api/support/tickets/${selectedTicket._id}/messages`, { 
        content: message.trim() 
      });
      
      if (response.data) {
        // Update with real data from server
        setTicketMessages(response.data.messages || []);
        // Refresh the tickets list to update the latest message
        await fetchTickets();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Revert optimistic update on error
      setTicketMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setMessage(message); // Restore the message
      // Show error message to user
      alert(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload image handler
  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTicket) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      setIsLoading(true);
      const res = await api.post(`/api/support/tickets/${selectedTicket._id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.message) {
        setTicketMessages((prev) => [...prev, res.data.message]);
        await fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const faqs = [
    {
      category: t('support.faqs.gettingStarted.category'),
      questions: [
        {
          id: 'gs1',
          question: t('support.faqs.gettingStarted.createAccount.question'),
          answer: t('support.faqs.gettingStarted.createAccount.answer')
        },
        {
          id: 'gs2',
          question: t('support.faqs.gettingStarted.verification.question'),
          answer: t('support.faqs.gettingStarted.verification.answer')
        },
        {
          id: 'gs3',
          question: t('support.faqs.gettingStarted.resetPassword.question'),
          answer: t('support.faqs.gettingStarted.resetPassword.answer')
        }
      ]
    },
    {
      category: t('support.faqs.transfers.category'),
      questions: [
        {
          id: 'tp1',
          question: t('support.faqs.transfers.transferTime.question'),
          answer: t('support.faqs.transfers.transferTime.answer')
        },
        {
          id: 'tp2',
          question: t('support.faqs.transfers.limits.question'),
          answer: t('support.faqs.transfers.limits.answer')
        },
        {
          id: 'tp3',
          question: t('support.faqs.transfers.addBank.question'),
          answer: t('support.faqs.transfers.addBank.answer')
        }
      ]
    },
    {
      category: t('support.faqs.security.category'),
      questions: [
        {
          id: 'sp1',
          question: t('support.faqs.security.accountSecurity.question'),
          answer: t('support.faqs.security.accountSecurity.answer')
        },
        {
          id: 'sp2',
          question: t('support.faqs.security.twoFactor.question'),
          answer: t('support.faqs.security.twoFactor.answer')
        },
        {
          id: 'sp3',
          question: t('support.faqs.security.suspiciousActivity.question'),
          answer: t('support.faqs.security.suspiciousActivity.answer')
        }
      ]
    },
    {
      category: t('support.faqs.accountManagement.category'),
      questions: [
        {
          id: 'am1',
          question: t('support.faqs.accountManagement.updateInfo.question'),
          answer: t('support.faqs.accountManagement.updateInfo.answer')
        },
        {
          id: 'am2',
          question: t('support.faqs.accountManagement.closeAccount.question'),
          answer: t('support.faqs.accountManagement.closeAccount.answer')
        },
        {
          id: 'am3',
          question: t('support.faqs.accountManagement.multipleAccounts.question'),
          answer: t('support.faqs.accountManagement.multipleAccounts.answer')
        }
      ]
    }
  ];

  const getPriorityColor = (priority) => {
    const config = {
      high: 'text-red-400 bg-red-400/20',
      medium: 'text-yellow-400 bg-yellow-400/20',
      low: 'text-green-400 bg-green-400/20'
    };
    return config[priority] || config.medium;
  };

  const getStatusColor = (status) => {
    const config = {
      open: 'text-green-400 bg-green-400/20',
      pending: 'text-yellow-400 bg-yellow-400/20',
      closed: 'text-gray-400 bg-gray-400/20'
    };
    return config[status] || config.pending;
  };

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl overflow-hidden h-[calc(100vh-12rem)]`}
        >
          {/* Support Hub Navigation */}
          <div className="border-b border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{t('support.title')}</h1>
              <button
                onClick={handleNewTicket}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('support.newTicket.title')}
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'home'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                {t('support.tabs.home')}
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {t('support.tabs.tickets')}
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'knowledge'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Book className="w-4 h-4" />
                {t('support.tabs.knowledge')}
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-145px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  {/* Search */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                      {i18n.language === 'ar' ? (
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      ) : (
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      )}
                      <input
                        type="text"
                        placeholder={t('support.search.placeholder')}
                        className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveTab('tickets')}
                      className={`p-6 rounded-xl border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors text-left group`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-blue-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{t('support.quickActions.contactSupport.title')}</h3>
                      <p className="text-gray-400">{t('support.quickActions.contactSupport.description')}</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveTab('knowledge')}
                      className={`p-6 rounded-xl border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors text-left group`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                          <Book className="w-6 h-6 text-purple-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{t('support.quickActions.knowledgeBase.title')}</h3>
                      <p className="text-gray-400">{t('support.quickActions.knowledgeBase.description')}</p>
                    </motion.button>

                    <motion.a
                      href="mailto:support@dinarflow.com"
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 rounded-xl border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors text-left group`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-green-400" />
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{t('support.quickActions.emailSupport.title')}</h3>
                      <p className="text-gray-400">{t('support.quickActions.emailSupport.description')}</p>
                    </motion.a>
                  </div>

                  {/* Popular Help Guides */}
                  <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-6">{t('support.popularGuides.title')}</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {faqs.slice(0, 2).map((category) => (
                        category.questions.slice(0, 1).map((faq) => (
                          <motion.button
                            key={faq.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              setExpandedFaq(faq.id);
                              setActiveTab('knowledge');
                            }}
                            className={`p-4 rounded-xl border ${
                              isDark 
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } transition-colors text-left group`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">{category.category}</span>
                            </div>
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <div className="flex items-center text-blue-400 text-sm">
                              {t('support.popularGuides.readGuide')}
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.button>
                        ))
                      ))}
                    </div>
                  </div>

                  {/* FAQs */}
                  <div>
                    <h2 className="text-xl font-semibold mb-6">{t('support.faqs.title')}</h2>
                    <div className="space-y-4">
                      {faqs.map((category) => (
                        <div key={category.category}>
                          <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                          <div className="space-y-2">
                            {category.questions.map((faq) => (
                              <button
                                key={faq.id}
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                className={`w-full p-4 rounded-xl border ${
                                  isDark
                                    ? 'bg-gray-800/50 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                } transition-colors text-left`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{faq.question}</span>
                                  <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                      expandedFaq === faq.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                                <AnimatePresence>
                                  {expandedFaq === faq.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mt-4 text-gray-400"
                                    >
                                      {faq.answer}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-12 h-full"
                >
                  {/* Ticket List */}
                  <div className={`col-span-4 border-r ${isDark ? 'border-gray-800' : 'border-gray-200'} h-full`}> 
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                          {i18n.language === 'ar' ? (
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          )}
                          <input
                            type="text"
                            placeholder={t('support.tickets.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full ${i18n.language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 ${
                              isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                            } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                          />
                        </div>
                        <button
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'bg-gray-800 hover:bg-gray-700'
                              : 'bg-gray-100 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          <Filter className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {tickets.map((ticket) => (
                          <button
                            key={ticket._id}
                            onClick={() => handleSelectTicket(ticket)}
                            className={`w-full p-4 rounded-xl ${
                              isDark
                                ? 'hover:bg-gray-800/50'
                                : 'hover:bg-gray-50'
                            } transition-colors border ${
                              selectedTicket?._id === ticket._id
                                ? 'border-blue-500'
                                : isDark
                                  ? 'border-gray-800'
                                  : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-left">{ticket.subject || t('support.tickets.noTitle')}</h3>
                              <span className="text-xs text-gray-400">{ticket.lastUpdate}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                                {t('support.tickets.status.' + ticket.status, ticket.status)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 text-left">
                              {ticket.category}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="col-span-8">
                    {selectedTicket ? (
                      <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-gray-800">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">{selectedTicket.subject || t('support.tickets.noTitle')}</h2>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                                {selectedTicket.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedTicket.status)}`}>
                                {t('support.tickets.status.' + selectedTicket.status, selectedTicket.status)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{t('support.tickets.ticketNumber', { id: selectedTicket._id })}</span>
                          </div>
                          <div className="mt-4">
                            {selectedTicket.status !== 'closed' && (
                              <button
                                onClick={handleCloseTicket}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                              >
                                {t('support.tickets.closeButton')}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                          {ticketMessages.map((message) => (
                            <div
                              key={message._id}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                            >
                              <div className={`max-w-[70%] flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  message.type === 'user'
                                    ? 'bg-blue-600/20'
                                    : 'bg-purple-600/20'
                                }`}>
                                  {message.type === 'user' ? (
                                    <User className="w-5 h-5 text-blue-400" />
                                  ) : (
                                    <Bot className="w-5 h-5 text-purple-400" />
                                  )}
                                </div>
                                <div>
                                  <div className={`rounded-xl px-6 py-3 ${
                                    message.type === 'user'
                                      ? 'bg-blue-600 text-white'
                                      : isDark
                                        ? 'bg-gray-800 text-gray-100'
                                        : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    {message.content && message.content.startsWith('/uploads/') ? (
                                      <img
                                        src={`${import.meta.env.VITE_API_URL || ''}${message.content}`}
                                        alt="attachment"
                                        className="max-w-xs max-h-60 rounded-lg border border-gray-200 dark:border-gray-700"
                                        style={{ objectFit: 'contain' }}
                                      />
                                    ) : (
                                      message.content
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                    {message.type === 'user' && (
                                      <CheckCheck className="w-4 h-4 text-blue-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 border-t border-gray-800">
                          <div className="flex items-end gap-4">
                            <div className="flex-1 relative">
                              <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t('support.tickets.replyPlaceholder', 'Type your message...')}
                                className={`w-full pr-12 py-3 pl-4 ${
                                  isDark
                                    ? 'bg-gray-800/50 border-gray-700 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                                rows={1}
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                              />
                              <button
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                type="button"
                                tabIndex={-1}
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                aria-label="Upload image"
                              >
                                <Paperclip className="w-5 h-5 text-gray-400" />
                              </button>
                              <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleUploadImage}
                              />
                            </div>
                            <button
                              className={`px-6 py-3 rounded-xl transition-colors flex items-center gap-2 ${
                                message.trim()
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : isDark
                                    ? 'bg-gray-800 text-gray-400'
                                    : 'bg-gray-100 text-gray-400'
                              }`}
                              onClick={handleSendMessage}
                              disabled={!message.trim()}
                              type="button"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-blue-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">{t('support.tickets.selectTitle')}</h3>
                          <p className="text-gray-400">{t('support.tickets.selectDescription')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'knowledge' && (
                <motion.div
                  key="knowledge"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                      {i18n.language === 'ar' ? (
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      ) : (
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      )}
                      <input
                        type="text"
                        placeholder={t('support.knowledge.searchPlaceholder')}
                        className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                        } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-6">{t('support.knowledge.guidesTitle')}</h2>
                    <div className="space-y-4">
                      {faqs.map((category) => (
                        <div key={category.category}>
                          <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                          <div className="space-y-2">
                            {category.questions.map((faq) => (
                              <button
                                key={faq.id}
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                className={`w-full p-4 rounded-xl border ${
                                  isDark
                                    ? 'bg-gray-800/50 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                } transition-colors text-left`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{faq.question}</span>
                                  <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                      expandedFaq === faq.id ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                                <AnimatePresence>
                                  {expandedFaq === faq.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mt-4 text-gray-400"
                                    >
                                      {faq.answer}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            {/* Modal Content */}
            <div className="p-8 pt-6">
              <h2 className="text-2xl font-bold mb-6 text-center">{t('support.newTicket.title')}</h2>
              <form onSubmit={e => { e.preventDefault(); handleCreateTicket(); }}>
                {/* Subject Field */}
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ticket-subject">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    {t('support.tickets.subjectLabel', 'Subject')}
                  </span>
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  value={newTicketTitle}
                  onChange={e => setNewTicketTitle(e.target.value)}
                  placeholder={t('support.tickets.subjectPlaceholder', 'Enter subject...')}
                  className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  maxLength={100}
                  required
                  autoFocus
                />
                {/* Message Field */}
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="ticket-message">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    {t('support.tickets.messageLabel', 'Message')}
                  </span>
                </label>
                <div className="relative mb-6">
                  <textarea
                    id="ticket-message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('support.tickets.messagePlaceholder', 'Describe your issue...')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[100px] max-h-[200px]"
                    maxLength={1000}
                    rows={4}
                    required
                  />
                  <span className="absolute bottom-2 right-4 text-xs text-gray-400">{message.length}/1000</span>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-3 mt-8">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!newTicketTitle.trim() || !message.trim() || isLoading}
                  >
                    <Send className="w-5 h-5" />
                    {t('support.newTicket.create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="mx-auto text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm underline"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      <ActionLoader isLoading={isLoading} />
    </>
  );
};

export default Support;
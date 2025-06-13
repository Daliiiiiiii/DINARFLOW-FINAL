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
  Mail,
  Download
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ActionLoader from '../assets/animations/ActionLoader';
import api from '../lib/axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

// --- TicketCard Component ---
const TicketCard = ({ ticket, selected, onClick, isDark }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03, boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative cursor-pointer group rounded-2xl px-5 py-4 mb-2 border transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/30 shadow-lg'
          : isDark
          ? 'border-gray-800 bg-gray-900/60 hover:bg-gray-800/60'
          : 'border-gray-200 bg-white/60 hover:bg-gray-100/80'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/20 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate text-base text-gray-900 dark:text-white">
              {ticket.subject || t('support.tickets.noTitle', 'No Title')}
            </h3>
            {ticket.status === 'open' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">{t('support.tickets.status.open', 'Open')}</span>
            )}
            {ticket.status === 'pending' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">{t('support.tickets.status.pending', 'Pending')}</span>
            )}
            {ticket.status === 'closed' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{t('support.tickets.status.closed', 'Closed')}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate mt-1">
            {ticket.lastMessage || t('support.tickets.noMessages', 'No messages yet')}
          </div>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: selected ? 1 : 0 }}
          className="ml-2"
        >
          <ChevronRight className="w-5 h-5 text-blue-400" />
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- ChatBubble Component ---
const ChatBubble = ({ message, isUser, isDark }) => {
  const [hovered, setHovered] = React.useState(false);
  const isImage = message.content && message.content.startsWith('/uploads/');
  const imageUrl = isImage ? `${import.meta.env.VITE_API_URL || ''}${message.content}` : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-400/30 to-blue-600/20'
            : 'bg-gradient-to-br from-purple-400/30 to-purple-600/20'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-blue-500" />
          ) : (
            <Bot className="w-4 h-4 text-purple-500" />
          )}
        </div>
        <div className="flex flex-col">
          <div
            className={`relative rounded-2xl px-5 py-3 shadow-md transition-all duration-200 group ${
              isUser
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-gray-100 text-gray-900'
            } ${hovered ? 'ring-2 ring-blue-300/40 scale-[1.025]' : ''}`}
          >
            {isImage ? (
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="attachment"
                  className="max-w-xs max-h-60 rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                />
                {hovered && (
                  <a
                    href={imageUrl}
                    download
                    className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    title="Download image"
                  >
                    <Download className="w-5 h-5 text-blue-500" />
                  </a>
                )}
              </div>
            ) : (
              message.content
            )}
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs ${isUser ? 'justify-end' : 'justify-start'} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
               style={{ opacity: 0.7 }}>
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            {isUser && <CheckCheck className="w-3 h-3 text-blue-300" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Support = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('tickets');
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
  const [userNotification, setUserNotification] = useState(null);

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
      const isAgent = data.message.type === 'agent';
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
      } else if (isAgent) {
        // Show notification if not currently viewing this ticket and message is from agent
        setUserNotification({
          subject: data.ticket.subject,
          content: data.message.content,
          ticketId: data.ticket._id
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
    // Only scroll to bottom if a new message is added (not when switching tickets)
    if (ticketMessages.length > 0 && messagesEndRef.current) {
      const lastMsg = ticketMessages[ticketMessages.length - 1];
      if (lastMsg && lastMsg._id && lastMsg._id !== 'SWITCHED') {
        scrollToBottom();
      }
    }
    // eslint-disable-next-line
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
    // Mark switch (so scroll effect doesn't trigger)
    setTicketMessages([{ _id: 'SWITCHED' }]);
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
    <div className="min-h-[calc(100vh-3rem)] flex flex-col bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-950 rounded-3xl md:rounded-[2.5rem] shadow-2xl mx-4 mt-6 mb-12 md:mx-12 md:mt-10 md:mb-16 border border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden">
      {/* Top Navigation Tabs */}
      <nav className="flex items-center gap-2 px-8 pt-8 pb-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-5 py-2 rounded-full font-semibold transition-all text-base flex items-center gap-2 ${
            activeTab === 'home'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white/60 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800'
          }`}
        >
          <LifeBuoy className="w-5 h-5" /> {t('navigation.home')}
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-5 py-2 rounded-full font-semibold transition-all text-base flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white/60 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" /> {t('navigation.tickets')}
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-5 py-2 rounded-full font-semibold transition-all text-base flex items-center gap-2 ${
            activeTab === 'knowledge'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white/60 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800'
          }`}
        >
          <Book className="w-5 h-5" /> {t('navigation.knowledge')}
        </button>
      </nav>

      <div className="flex-1 flex h-full min-h-0">
        {/* Sidebar: Ticket List (only for Tickets tab) */}
        {activeTab === 'tickets' && (
          <aside className="w-full max-w-xs h-full sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 backdrop-blur-xl flex flex-col rounded-3xl md:rounded-[2.5rem] ml-2 mt-2 mb-2">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('support.tickets.title', 'Tickets')}</h2>
              <button
                onClick={handleNewTicket}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white p-2 shadow transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {tickets.map(ticket => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  selected={selectedTicket?._id === ticket._id}
                  onClick={() => handleSelectTicket(ticket)}
                  isDark={isDark}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-950">
          {/* Home Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 max-w-3xl mx-auto w-full"
              >
                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveTab('tickets')}
                    className="p-6 rounded-3xl border bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('support.contactSupport')}</h3>
                    <p className="text-gray-400">{t('support.contactSupportDescription')}</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveTab('knowledge')}
                    className="p-6 rounded-3xl border bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <Book className="w-6 h-6 text-purple-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('support.knowledgeBase')}</h3>
                    <p className="text-gray-400">{t('support.knowledgeBaseDescription')}</p>
                  </motion.button>
                  <motion.a
                    href="mailto:support@dinarflow.com"
                    whileHover={{ scale: 1.03 }}
                    className="p-6 rounded-3xl border bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 shadow transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <LifeBuoy className="w-6 h-6 text-green-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('support.emailSupport')}</h3>
                    <p className="text-gray-400">{t('support.emailSupportDescription')}</p>
                  </motion.a>
                </div>
                {/* FAQ Accordion */}
                <div className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">{t('support.faq')}</h2>
                  <div className="space-y-4">
                    {faqs.map((category) => (
                      <div key={category.category}>
                        <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                        <div className="space-y-2">
                          {category.questions.map((faq) => (
                            <button
                              key={faq.id}
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="w-full p-4 rounded-2xl md:rounded-3xl border bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 transition-colors text-left"
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

            {/* Tickets Tab (already implemented) */}
            {activeTab === 'tickets' && (
              <>
                {/* Chat Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-8 py-5 flex items-center gap-4 shadow-sm">
                  {selectedTicket ? (
                    <>
                      <h3 className="text-lg font-semibold truncate flex-1">{selectedTicket.subject || t('support.tickets.noTitle', 'No Title')}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {t(`support.tickets.status.${selectedTicket.status}`, selectedTicket.status)}
                      </span>
                      {selectedTicket.status !== 'closed' && (
                        <button
                          onClick={handleCloseTicket}
                          className="ml-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow"
                        >
                          {t('support.tickets.closeButton')}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">{t('support.tickets.selectDescription', 'Select a ticket to view conversation')}</span>
                  )}
                </div>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
                  {selectedTicket && ticketMessages.length > 0 ? (
                    ticketMessages.map(msg => (
                      <ChatBubble
                        key={msg._id}
                        message={msg}
                        isUser={msg.type === 'user'}
                        isDark={isDark}
                      />
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">{t('support.tickets.noMessages', 'No messages yet')}</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {/* Chat Input */}
                {selectedTicket && (
                  selectedTicket.status === 'closed' ? (
                    <div className="sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-xl">
                      <span className="text-red-600 font-semibold text-base">{t('support.tickets.closedWarning')}</span>
                    </div>
                  ) : (
                    <div className="sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex items-end gap-4 shadow-xl">
                      <div className="flex-1 relative">
                        <textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder={t('support.tickets.replyPlaceholder')}
                          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-5 py-3 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow"
                          rows={1}
                          style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 text-blue-500 transition-all"
                          type="button"
                          tabIndex={-1}
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          aria-label="Upload image"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleUploadImage}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-3 rounded-2xl font-semibold shadow transition-colors flex items-center gap-2 text-lg ${
                          message.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        type="button"
                      >
                        <Send className="w-5 h-5" />
                      </motion.button>
                    </div>
                  )
                )}
              </>
            )}

            {/* Knowledge Tab */}
            {activeTab === 'knowledge' && (
              <motion.div
                key="knowledge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 max-w-3xl mx-auto w-full"
              >
                <div className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">{t('support.knowledge.guidesTitle', t('support.knowledgeBase'))}</h2>
                  <div className="space-y-4">
                    {faqs.map((category) => (
                      <div key={category.category}>
                        <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                        <div className="space-y-2">
                          {category.questions.map((faq) => (
                            <button
                              key={faq.id}
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="w-full p-4 rounded-2xl md:rounded-3xl border bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 transition-colors text-left"
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
        </main>
      </div>
      <ActionLoader isLoading={isLoading} />

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowNewTicketModal(false)}
              aria-label="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-6">{t('support.tickets.newTicketTitle', 'Create New Ticket')}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="new-ticket-title">
                {t('support.tickets.subjectLabel', 'Subject')}
              </label>
              <input
                id="new-ticket-title"
                type="text"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTicketTitle}
                onChange={e => setNewTicketTitle(e.target.value)}
                placeholder={t('support.tickets.subjectPlaceholder', 'Enter subject...')}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" htmlFor="new-ticket-message">
                {t('support.tickets.messageLabel', 'Message')}
              </label>
              <textarea
                id="new-ticket-message"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('support.tickets.messagePlaceholder', 'Describe your issue...')}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                onClick={() => setShowNewTicketModal(false)}
                type="button"
              >
                {t('support.tickets.cancelButton', 'Cancel')}
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
                onClick={handleCreateTicket}
                disabled={!newTicketTitle.trim() || !message.trim() || isLoading}
                type="button"
              >
                {t('support.tickets.createButton', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup for agent replies */}
      {userNotification && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 min-w-[260px] max-w-xs animate-fade-in">
          <div className="font-semibold mb-1">Support Replied</div>
          <div className="truncate font-medium">{userNotification.subject}</div>
          <div className="truncate text-sm mb-2">{userNotification.content}</div>
          <div className="flex gap-2 justify-end">
            <button
              className="underline text-xs hover:text-blue-200"
              onClick={() => {
                setSelectedTicket(tickets.find(t => t._id === userNotification.ticketId));
                setUserNotification(null);
              }}
            >
              View
            </button>
            <button
              className="text-xs hover:text-blue-200"
              onClick={() => setUserNotification(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
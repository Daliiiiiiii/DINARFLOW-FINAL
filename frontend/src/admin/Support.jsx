import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const Support = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { t, i18n } = useTranslation();

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
      console.log('WebSocket connected for admin support');
    });

    newSocket.on('support:message:received', (data) => {
      console.log('Received support message:', data);
      if (selectedTicket && data.ticket._id === selectedTicket._id) {
        setSelectedTicket(prev => {
          // Check if message already exists
          const messageExists = prev.messages.some(msg => 
            msg._id === data.message._id || 
            (msg.timestamp === data.message.timestamp && msg.content === data.message.content)
          );
          if (messageExists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message]
          };
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

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/support/admin/tickets');
      // Fetch user details for each ticket
      const ticketsWithUsers = await Promise.all(
        response.data.map(async (ticket) => {
          try {
            const userResponse = await api.get(`/api/admin/users/${ticket.userId}`);
            return {
              ...ticket,
              user: userResponse.data,
              priority: ticket.priority || 'medium'
            };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return {
              ...ticket,
              user: {
                name: 'Unknown User',
                email: 'N/A'
              },
              priority: ticket.priority || 'medium'
            };
          }
        })
      );
      setTickets(ticketsWithUsers);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    // Create optimistic message
    const optimisticMessage = {
      _id: Date.now().toString(), // Temporary ID
      content: replyMessage.trim(),
      type: 'agent',
      timestamp: new Date().toISOString()
    };

    // Update UI optimistically
    setSelectedTicket(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage]
    }));
    setReplyMessage('');

    try {
      setIsLoading(true);
      const response = await api.post(`/api/support/admin/tickets/${selectedTicket._id}/messages`, {
        content: replyMessage.trim(),
        type: 'agent'
      });
      
      // Update with real data from server
      setSelectedTicket(response.data);
      // Update the ticket in the tickets list
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === selectedTicket._id ? response.data : ticket
        )
      );
    } catch (error) {
      console.error('Error sending reply:', error);
      // Revert optimistic update on error
      setSelectedTicket(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg._id !== optimisticMessage._id)
      }));
      setReplyMessage(replyMessage); // Restore the message
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      setIsLoading(true);
      await api.patch(`/api/support/admin/tickets/${selectedTicket._id}/status`, {
        status: 'closed'
      });
      await fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error closing ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      open: {
        icon: AlertTriangle,
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      },
      in_progress: {
        icon: Clock,
        className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      },
      closed: {
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      }
    };

    const { icon: Icon, className } = config[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        <Icon className="w-4 h-4" />
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority = 'medium') => {
    const config = {
      low: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
      medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
      high: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.messages[0]?.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.supportTickets')}</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-yellow-400 font-medium">8</span> {t('admin.open')}
            </span>
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-blue-400 font-medium">5</span> {t('admin.inProgress')}
            </span>
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-green-400 font-medium">12</span> {t('admin.closed')}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl shadow-lg overflow-hidden`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('admin.searchTicketsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full ${i18n.language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${i18n.language === 'ar' ? 'right-3' : 'left-3'}`} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800/70'
                      : 'border-gray-300 focus:border-purple-500 hover:bg-gray-50'
                  } focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 shadow-lg shadow-purple-500/10'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-md'
                } flex items-center gap-2`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDark
                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 shadow-lg shadow-blue-500/10'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-md'
                } flex items-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Subject</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Priority</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Created</th>
                  <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <motion.tr 
                    key={ticket._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`group hover:${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    } transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${
                          isDark ? 'bg-gray-800' : 'bg-gray-200'
                        } flex items-center justify-center`}>
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">{ticket.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.user?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {ticket.messages[0]?.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {ticket.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Reply
                        </button>
                        {ticket.status !== 'closed' && (
                          <button
                            onClick={handleCloseTicket}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing 1 to {filteredTickets.length} of {tickets.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}>
                  Previous
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Support Ticket</h2>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-500 hover:text-gray-400"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Ticket Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">User</label>
                      <div className="font-medium">{selectedTicket.userId}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Created</label>
                      <div className="font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Status</label>
                      <div>{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Priority</label>
                      <div>{getPriorityBadge(selectedTicket.priority || 'medium')}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Subject</label>
                    <div className="font-medium">{selectedTicket.subject}</div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.type === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.type === 'agent' ? 'bg-blue-600/20' : isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4`}>
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(message.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Box */}
                  {selectedTicket.status !== 'closed' && (
                    <div className="mt-6">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                              : 'border-gray-300 focus:border-blue-500'
                          } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || isLoading}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            replyMessage.trim() && !isLoading
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : isDark
                                ? 'bg-gray-800 text-gray-400'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Support;
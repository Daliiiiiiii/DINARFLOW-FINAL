import React, { useState } from 'react';
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

const Support = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const tickets = [
    {
      id: 1,
      user: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      subject: 'Unable to complete bank transfer',
      message: 'I tried to transfer money to my bank account but the transaction failed. Can you help me?',
      status: 'open',
      priority: 'high',
      createdAt: '2024-03-15 14:30',
      messages: [
        {
          id: 1,
          type: 'user',
          content: 'I tried to transfer money to my bank account but the transaction failed. Can you help me?',
          timestamp: '2024-03-15 14:30'
        },
        {
          id: 2,
          type: 'admin',
          content: 'Hello John, I understand you\'re having issues with bank transfers. Could you please provide the transaction ID?',
          timestamp: '2024-03-15 14:35'
        }
      ]
    },
    {
      id: 2,
      user: {
        name: 'Sarah Smith',
        email: 'sarah@example.com'
      },
      subject: 'KYC verification pending',
      message: 'My KYC verification has been pending for 3 days. When will it be approved?',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-03-15 12:45',
      messages: [
        {
          id: 1,
          type: 'user',
          content: 'My KYC verification has been pending for 3 days. When will it be approved?',
          timestamp: '2024-03-15 12:45'
        }
      ]
    },
    {
      id: 3,
      user: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed@example.com'
      },
      subject: 'Account locked',
      message: 'My account was locked due to suspicious activity but I can assure you it was me.',
      status: 'closed',
      priority: 'high',
      createdAt: '2024-03-15 10:20',
      messages: [
        {
          id: 1,
          type: 'user',
          content: 'My account was locked due to suspicious activity but I can assure you it was me.',
          timestamp: '2024-03-15 10:20'
        },
        {
          id: 2,
          type: 'admin',
          content: 'We\'ve reviewed your account and unlocked it. Please enable 2FA for additional security.',
          timestamp: '2024-03-15 10:30'
        },
        {
          id: 3,
          type: 'user',
          content: 'Thank you! I\'ve enabled 2FA now.',
          timestamp: '2024-03-15 10:35'
        }
      ]
    }
  ];

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

  const getPriorityBadge = (priority) => {
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

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;

    // Add reply to messages
    const newMessage = {
      id: selectedTicket.messages.length + 1,
      type: 'admin',
      content: replyMessage,
      timestamp: new Date().toISOString()
    };

    setSelectedTicket(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    setReplyMessage('');
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-yellow-400 font-medium">8</span> Open
            </span>
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-blue-400 font-medium">5</span> In Progress
            </span>
            <span className={`px-3 py-1 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className="text-green-400 font-medium">12</span> Closed
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
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                        : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                {tickets.map((ticket) => (
                  <motion.tr 
                    key={ticket.id}
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
                          <div className="font-medium">{ticket.user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {ticket.message}
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
                          <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
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
                Showing 1 to 3 of 3 entries
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
                      <div className="font-medium">{selectedTicket.user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{selectedTicket.user.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Created</label>
                      <div className="font-medium">{selectedTicket.createdAt}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Status</label>
                      <div>{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Priority</label>
                      <div>{getPriorityBadge(selectedTicket.priority)}</div>
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
                        key={message.id}
                        className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.type === 'admin' ? 'bg-blue-600/20' : isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4`}>
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{message.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {selectedTicket.status !== 'closed' && (
                    <div className="pt-4">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none`}
                        rows={4}
                      />
                      <div className="flex items-center justify-end gap-3 mt-4">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className={`px-4 py-2 rounded-lg ${
                            isDark
                              ? 'bg-gray-800 hover:bg-gray-700'
                              : 'bg-gray-100 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send Reply
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
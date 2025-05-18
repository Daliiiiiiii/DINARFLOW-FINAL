import React, { useState } from 'react';
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
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';
import ActionLoader from '../../components/ui/ActionLoader';

const Support = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showArticle, setShowArticle] = useState(null);

  const tickets = [
    {
      id: 1,
      subject: "Failed Bank Transfer",
      priority: "high",
      status: "open",
      lastUpdate: "2 min ago",
      category: "Payment",
      messages: [
        {
          id: 1,
          type: 'user',
          content: 'Hi, my bank transfer failed but the money was deducted from my account.',
          timestamp: '2024-03-15 14:30'
        }
      ]
    },
    {
      id: 2,
      subject: "Account Verification Issue",
      priority: "medium",
      status: "pending",
      lastUpdate: "1 hour ago",
      category: "KYC",
      messages: []
    }
  ];

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          id: 'gs1',
          question: "How do I create an account?",
          answer: "Creating an account is simple. Click the 'Get Started' button, provide your email and phone number, and follow the verification steps."
        },
        {
          id: 'gs2',
          question: "What documents do I need for verification?",
          answer: "You'll need a valid government-issued ID (National ID or Passport) and a recent utility bill for address verification."
        }
      ]
    },
    {
      category: "Transfers & Payments",
      questions: [
        {
          id: 'tp1',
          question: "How long do transfers take?",
          answer: "Internal transfers between DinarFlow accounts are instant. Bank transfers typically take 1-2 business days to complete."
        },
        {
          id: 'tp2',
          question: "What are the transfer limits?",
          answer: "Daily transfer limits are set at 10,000 TND for verified accounts. This can be increased by contacting support."
        }
      ]
    }
  ];

  const articles = [
    {
      id: 'art1',
      title: "Complete Guide to Account Verification",
      category: "Account",
      readTime: "5 min read",
      content: `
        <h2>Account Verification Process</h2>
        <p>Follow these steps to verify your account:</p>
        <ol>
          <li>Submit your government-issued ID</li>
          <li>Provide proof of address</li>
          <li>Complete facial verification</li>
          <li>Wait for approval (typically 24-48 hours)</li>
        </ol>
      `
    },
    {
      id: 'art2',
      title: "Understanding Transfer Fees",
      category: "Payments",
      readTime: "3 min read",
      content: `
        <h2>Transfer Fee Structure</h2>
        <p>Our fee structure is transparent and competitive:</p>
        <ul>
          <li>Internal transfers: Free</li>
          <li>Bank transfers: 0.5%</li>
          <li>International transfers: 1%</li>
        </ul>
      `
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
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800'
              : 'bg-white border-gray-200'
            } border rounded-xl overflow-hidden h-[calc(100vh-12rem)]`}
        >
          {/* Support Hub Navigation */}
          <div className="border-b border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Support Center</h1>
              <button
                onClick={() => setActiveTab('tickets')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'home'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <LifeBuoy className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'tickets'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                My Tickets
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'knowledge'
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Book className="w-4 h-4" />
                Knowledge Base
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-145px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
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
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for help..."
                        className={`w-full pl-12 pr-4 py-3 ${isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-900'
                          } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveTab('tickets')}
                      className={`p-6 rounded-xl border ${isDark
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
                      <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                      <p className="text-gray-400">Get help from our support team</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveTab('knowledge')}
                      className={`p-6 rounded-xl border ${isDark
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
                      <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
                      <p className="text-gray-400">Browse articles and tutorials</p>
                    </motion.button>

                    <motion.a
                      href="mailto:support@dinarflow.com"
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 rounded-xl border ${isDark
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
                      <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                      <p className="text-gray-400">Send us an email directly</p>
                    </motion.a>
                  </div>

                  {/* Popular Articles */}
                  <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-6">Popular Articles</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {articles.slice(0, 2).map((article) => (
                        <motion.button
                          key={article.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setShowArticle(article);
                            setActiveTab('knowledge');
                          }}
                          className={`p-4 rounded-xl border ${isDark
                              ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } transition-colors text-left group`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">{article.category}</span>
                            <span className="text-sm text-gray-400">{article.readTime}</span>
                          </div>
                          <h3 className="font-medium mb-2">{article.title}</h3>
                          <div className="flex items-center text-blue-400 text-sm">
                            Read Article
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* FAQs */}
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                      {faqs.map((category) => (
                        <div key={category.category}>
                          <h3 className="text-lg font-medium mb-4">{category.category}</h3>
                          <div className="space-y-2">
                            {category.questions.map((faq) => (
                              <button
                                key={faq.id}
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                className={`w-full p-4 rounded-xl border ${isDark
                                    ? 'bg-gray-800/50 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                  } transition-colors text-left`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{faq.question}</span>
                                  <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''
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
                  <div className={`col-span-4 border-r ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 ${isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                              } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <button
                          className={`p-2 rounded-lg ${isDark
                              ? 'bg-gray-800 hover:bg-gray-700'
                              : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                        >
                          <Filter className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {tickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`w-full p-4 rounded-xl ${isDark
                                ? 'hover:bg-gray-800/50'
                                : 'hover:bg-gray-50'
                              } transition-colors border ${selectedTicket?.id === ticket.id
                                ? 'border-blue-500'
                                : isDark
                                  ? 'border-gray-800'
                                  : 'border-gray-200'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-left">{ticket.subject}</h3>
                              <span className="text-xs text-gray-400">{ticket.lastUpdate}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
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
                  <div className="col-span-8 h-full flex flex-col">
                    {selectedTicket ? (
                      <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex-shrink-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                                {selectedTicket.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedTicket.status)}`}>
                                {selectedTicket.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Ticket #{selectedTicket.id}</span>
                            <span>Created {selectedTicket.lastUpdate}</span>
                            <span>{selectedTicket.category}</span>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-0">
                          {selectedTicket.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                            >
                              <div className={`max-w-[70%] flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
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
                                  <div className={`rounded-xl px-6 py-3 ${message.type === 'user'
                                      ? 'bg-blue-600 text-white'
                                      : isDark
                                        ? 'bg-gray-800 text-gray-100'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}>
                                    {message.content}
                                  </div>
                                  <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'
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
                        </div>

                        <div className="p-6 border-t border-gray-800">
                          <div className="flex items-end gap-4">
                            <div className="flex-1 relative">
                              <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className={`w-full pr-12 py-3 pl-4 ${isDark
                                    ? 'bg-gray-800/50 border-gray-700 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                  } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                                rows={1}
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                              />
                              <button
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                onClick={() => { }}
                              >
                                <Paperclip className="w-5 h-5 text-gray-400" />
                              </button>
                            </div>
                            <button
                              className={`px-6 py-3 rounded-xl transition-colors flex items-center gap-2 ${message.trim()
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
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-blue-400" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Select a Ticket</h3>
                          <p className="text-gray-400">Choose a ticket to view the conversation</p>
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
                  {showArticle ? (
                    <div>
                      <button
                        onClick={() => setShowArticle(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Articles
                      </button>

                      <div className={`p-8 rounded-xl border ${isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="max-w-3xl mx-auto">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-sm text-gray-400">{showArticle.category}</span>
                            <span className="text-sm text-gray-400">{showArticle.readTime}</span>
                          </div>
                          <h1 className="text-2xl font-bold mb-8">{showArticle.title}</h1>
                          <div
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: showArticle.content }}
                          />
                          <div className="mt-8 pt-8 border-t border-gray-700">
                            <p className="text-gray-400 mb-4">Was this article helpful?</p>
                            <div className="flex items-center gap-4">
                              <button className={`p-2 rounded-lg ${isDark
                                  ? 'hover:bg-gray-700'
                                  : 'hover:bg-gray-200'
                                } transition-colors`}>
                                <ThumbsUp className="w-5 h-5 text-gray-400" />
                              </button>
                              <button className={`p-2 rounded-lg ${isDark
                                  ? 'hover:bg-gray-700'
                                  : 'hover:bg-gray-200'
                                } transition-colors`}>
                                <ThumbsDown className="w-5 h-5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="max-w-2xl mx-auto mb-8">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search articles..."
                            className={`w-full pl-12 pr-4 py-3 ${isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {articles.map((article) => (
                          <motion.button
                            key={article.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setShowArticle(article)}
                            className={`p-6 rounded-xl border ${isDark
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              } transition-colors text-left group`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">{article.category}</span>
                              <span className="text-sm text-gray-400">{article.readTime}</span>
                            </div>
                            <h3 className="text-lg font-medium mb-4">{article.title}</h3>
                            <div className="flex items-center text-blue-400">
                              Read Article
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <ActionLoader isLoading={isLoading} />
    </DashboardLayout>
  );
};

export default Support;
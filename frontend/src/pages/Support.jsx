import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessagesSquare, 
  ChevronDown, 
  Send, 
  Clock, 
  CheckCheck, 
  User, 
  Bot,
  Search,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ActionLoader from '../assets/animations/ActionLoader';

const Support = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showChat, setShowChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [messages, setMessages] = useState([]);

  const faqItems = [
    {
      category: 'General',
      items: [
        {
          question: 'What payment methods do you support?',
          answer: 'We support bank transfers and credit/debit cards for all transactions on our platform.'
        },
        {
          question: 'Are there any fees for transfers?',
          answer: 'Transfers between DinarFlow users are free. Bank transfers may incur small fees.'
        }
      ]
    },
    {
      category: 'Security',
      items: [
        {
          question: 'How secure is my money?',
          answer: 'Your money is protected by bank-grade security measures and encryption.'
        }
      ]
    }
  ];

  const filteredFaqs = faqItems.map(category => ({
    ...category,
    items: category.items.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const handleStartChat = () => {
    setShowChat(true);
    setMessages([
      {
        id: 1,
        type: 'agent',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      }
    ]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const agentMessage = {
        id: messages.length + 2,
        type: 'agent',
        content: 'Thank you for your message. One of our agents will assist you shortly.',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      setMessages(prev => [
        ...prev.map(m => m.id === userMessage.id ? { ...m, status: 'delivered' } : m),
        agentMessage
      ]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Support Center</h1>
          {!showChat && (
            <button
              onClick={handleStartChat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MessagesSquare className="w-4 h-4" />
              Chat with Agent
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search */}
              <div className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6`}>
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search FAQs..."
                    className={`w-full pl-10 pr-4 py-2 ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              {/* FAQs */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredFaqs.map((category) => (
                  <div
                    key={category.category}
                    className={`${
                      isDark 
                        ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                        : 'bg-white border-gray-200'
                    } border rounded-xl p-6`}
                  >
                    <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
                    <div className="space-y-3">
                      {category.items.map((faq) => (
                        <div key={faq.question} className="border-b border-gray-700 last:border-0 pb-3 last:pb-0">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === faq.question ? null : faq.question)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{faq.question}</span>
                              <ChevronDown className={`w-5 h-5 transition-transform ${
                                expandedFaq === faq.question ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </button>
                          <AnimatePresence>
                            {expandedFaq === faq.question && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="mt-2 text-gray-400">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Still Need Help */}
              <div className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 text-center`}>
                <h2 className="text-xl font-semibold mb-2">Still Need Help?</h2>
                <p className="text-gray-400 mb-4">Our support team is here to assist you</p>
                <button
                  onClick={handleStartChat}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <MessagesSquare className="w-5 h-5" />
                  Start Live Chat
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              {/* Chat Interface */}
              <div className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6 h-[calc(100vh-16rem)]`}>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowChat(false)}
                    className={`p-2 rounded-lg ${
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="h-[calc(100%-120px)] overflow-y-auto space-y-4 mb-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.type === 'user' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-purple-600/20 text-purple-400'
                        }`}>
                          {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className={`rounded-2xl px-4 py-2 ${
                            msg.type === 'user'
                              ? 'bg-blue-600/20 text-blue-100'
                              : isDark
                                ? 'bg-gray-800 text-gray-100'
                                : 'bg-gray-100 text-gray-900'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          } ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                            {msg.type === 'user' && (
                              msg.status === 'sending' 
                                ? <Clock className="w-3 h-3" />
                                : <CheckCheck className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Message Input */}
                <div className={`${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } border rounded-xl p-4 absolute bottom-6 left-6 right-6`}>
                  <div className="flex items-end gap-4">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className={`flex-1 resize-none ${
                        isDark
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      } border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        message.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isDark
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ActionLoader isLoading={isLoading} />
      </>
  );
};

export default Support;
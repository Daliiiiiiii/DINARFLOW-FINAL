import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const P2PChat = ({ orderId, onClose }) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrderAndMessages = async () => {
      try {
        setLoading(true);
        // Fetch order details
        const orderResponse = await axios.get(`/api/p2p/orders/${orderId}`);
        setOrder(orderResponse.data);

        // Fetch messages
        const messagesResponse = await axios.get(`/api/p2p/orders/${orderId}/messages`);
        setMessages(messagesResponse.data);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast.error('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderAndMessages();
    }
  }, [orderId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(`/api/p2p/orders/${orderId}/messages`, {
        content: newMessage
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Chat Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Order #{order?._id?.slice(-6)}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {order?.status === 'pending' ? 'Waiting for payment' : 
               order?.status === 'paid' ? 'Payment received' :
               order?.status === 'completed' ? 'Completed' :
               order?.status === 'cancelled' ? 'Cancelled' : 'Disputed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-opacity-10 ${
              isDark ? 'hover:bg-white' : 'hover:bg-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === currentUser._id
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === currentUser._id
                  ? 'text-blue-100'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-500'
              }`}>
                {formatTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 p-2 rounded-lg ${
              isDark
                ? 'bg-gray-800 text-white placeholder-gray-400'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            type="submit"
            className={`p-2 rounded-lg ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default P2PChat; 
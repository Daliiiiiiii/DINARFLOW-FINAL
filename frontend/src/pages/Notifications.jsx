import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Building2,
  Shield,
  Filter,
  Search,
  ChevronDown,
  Settings,
  Trash2,
  CheckCheck,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Ensure axios sends auth token if present
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const Notifications = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { notifications, setNotifications, unreadCount, setUnreadCount } = useNotification();
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Debug: log notification types
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      console.log('Notification types:', notifications.map(n => n.type));
    }
  }, [notifications]);

  // Define P2P-related data types (from P2PChat and any other P2P/chat logic)
  const P2P_DATA_TYPES = [
    'funds_released',
    'order_cancelled',
    'new_order',
    'payment_received',
    'payment_verified',
    'dispute_opened',
    'dispute_resolved',
    // Add any other P2P/chat notification data types here
  ];

  // Define crypto-related data types
  const CRYPTO_DATA_TYPES = [
    'send',
    'receive',
    'swap',
    'stake',
    'unstake',
    'yield',
    'deposit',
    'withdrawal'
  ];

  const categoryTypeMap = {
    all: null,
    alert: ['alert'],
    // Transfers: 'transaction' notifications that are NOT P2P-related or crypto-related
    transfers: ['transaction'],
    // P2P: any notification with type 'transaction' and data.type in P2P_DATA_TYPES, or type in P2P/chat types
    p2p: ['p2p', 'chat', 'p2p_order', 'p2p_message', 'p2p_chat'],
    // Crypto: notifications with type 'crypto' or 'transaction' with crypto-related data.type
    crypto: ['crypto']
  };

  const categories = [
    { id: 'all', label: t('notifications.categories.all') },
    { id: 'alert', label: t('notifications.categories.alert') },
    { id: 'transfers', label: t('notifications.categories.transfers') },
    { id: 'p2p', label: t('notifications.categories.p2p') },
    { id: 'crypto', label: t('notifications.categories.crypto') }
  ];

  // Filtering logic
  const filteredNotifications = notifications.filter(notification => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'p2p') {
      // P2P: type in p2p/chat types OR type 'transaction' with data.type in P2P_DATA_TYPES
      return (
        categoryTypeMap.p2p.includes(notification.type) ||
        (notification.type === 'transaction' && P2P_DATA_TYPES.includes(notification.data?.type))
      );
    }
    if (selectedCategory === 'crypto') {
      // Crypto: type 'crypto' OR type 'transaction' with data.type in CRYPTO_DATA_TYPES
      return (
        notification.type === 'crypto' ||
        (notification.type === 'transaction' && CRYPTO_DATA_TYPES.includes(notification.data?.type))
      );
    }
    if (selectedCategory === 'transfers') {
      // Transfers: type 'transaction' but NOT P2P-related or crypto-related
      return (
        notification.type === 'transaction' &&
        !P2P_DATA_TYPES.includes(notification.data?.type) &&
        !CRYPTO_DATA_TYPES.includes(notification.data?.type)
      );
    }
    if (Array.isArray(categoryTypeMap[selectedCategory])) {
      return categoryTypeMap[selectedCategory].includes(notification.type);
    }
    return false;
  }).filter(notification =>
    (notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     notification.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Debug: log handler calls
  const handleMarkAsRead = async (notificationId) => {
    console.log('Mark as read clicked for', notificationId);
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    console.log('Delete clicked for', notificationId);
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400 bg-blue-400/20',
      yellow: 'text-yellow-400 bg-yellow-400/20',
      green: 'text-green-400 bg-green-400/20',
      red: 'text-red-400 bg-red-400/20'
    };
    return colors[color] || colors.blue;
  };

  // Update category counts for sidebar
  const getCategoryCount = (id) => {
    if (id === 'all') {
      return notifications.length;
    } else if (id === 'p2p') {
      return notifications.filter(n =>
        categoryTypeMap.p2p.includes(n.type) ||
        (n.type === 'transaction' && P2P_DATA_TYPES.includes(n.data?.type))
      ).length;
    } else if (id === 'crypto') {
      return notifications.filter(n =>
        n.type === 'crypto' ||
        (n.type === 'transaction' && CRYPTO_DATA_TYPES.includes(n.data?.type))
      ).length;
    } else if (id === 'transfers') {
      return notifications.filter(n =>
        n.type === 'transaction' &&
        !P2P_DATA_TYPES.includes(n.data?.type) &&
        !CRYPTO_DATA_TYPES.includes(n.data?.type)
      ).length;
    } else if (Array.isArray(categoryTypeMap[id])) {
      return notifications.filter(n => categoryTypeMap[id].includes(n.type)).length;
    } else {
      return 0;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${
              isDark ? 'bg-blue-900/20' : 'bg-blue-100'
            } flex items-center justify-center`}>
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
              <p className="text-gray-500 dark:text-gray-400">{t('notifications.subtitle')}</p>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Categories */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl p-6`}
            >
              <h2 className="text-lg font-semibold mb-4">{t('notifications.categories.title')}</h2>
              <div className="space-y-2">
                {categories.map(({ id, label }) => {
                  const count = getCategoryCount(id);
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedCategory(id)}
                      className={`w-full p-3 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === id
                          ? isDark
                            ? 'bg-blue-900/20 text-blue-400'
                            : 'bg-blue-50 text-blue-600'
                          : isDark
                            ? 'hover:bg-gray-800'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        selectedCategory === id
                          ? isDark
                            ? 'bg-blue-400/20 text-blue-400'
                            : 'bg-blue-100 text-blue-600'
                          : isDark
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl overflow-hidden`}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('notifications.search.placeholder')}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                            : 'border-gray-300 focus:border-blue-500'
                        } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                  <button className={`px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            } transition-colors flex items-center gap-2`} onClick={handleDeleteAllNotifications} title={t('notifications.actions.clearAll')}>
              <Trash2 className="w-4 h-4" />
              {t('notifications.actions.clearAll')}
            </button>
                    <button className={`px-4 py-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center gap-2`} onClick={handleMarkAllAsRead} title={t('notifications.actions.markAllRead')}>
                      <CheckCheck className="w-4 h-4" />
                      {t('notifications.actions.markAllRead')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-800">
                {isLoading ? (
                  <div className="p-6 text-center text-gray-400">{t('notifications.loading')}</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <div className="font-medium">{t('notifications.empty.title')}</div>
                    <div className="text-sm mt-1">{t('notifications.empty.description')}</div>
                  </div>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 ${
                        !notification.read
                          ? isDark
                            ? 'bg-gray-800/50'
                            : 'bg-gray-50'
                          : ''
                      } transition-colors relative group`}
                    >
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'transaction' ? 'text-green-400 bg-green-400/20' :
                          notification.type === 'alert' ? 'text-red-400 bg-red-400/20' :
                          'text-blue-400 bg-blue-400/20'
                        }`}>
                          {notification.type === 'transaction' ? <Wallet className="w-5 h-5" /> :
                          notification.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
                          <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">
                                {t(notification.title, {
                                  amount: notification.data?.amount,
                                  currency: notification.data?.currency,
                                  recipient: notification.data?.recipientName ? ` to ${notification.data.recipientName}` : '',
                                  sender: notification.data?.senderName ? ` from ${notification.data.senderName}` : '',
                                  location: notification.data?.location,
                                  device: notification.data?.device,
                                  status: notification.data?.enabled ? t('common.enabled') : t('common.disabled'),
                                  type: notification.data?.type,
                                  date: notification.data?.date,
                                  message: notification.data?.message,
                                  featureName: notification.data?.featureName
                                })}
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {t(notification.message, {
                                  amount: notification.data?.amount,
                                  currency: notification.data?.currency,
                                  recipient: notification.data?.recipientName ? ` to ${notification.data.recipientName}` : '',
                                  sender: notification.data?.senderName ? ` from ${notification.data.senderName}` : '',
                                  location: notification.data?.location,
                                  device: notification.data?.device,
                                  status: notification.data?.enabled ? t('common.enabled') : t('common.disabled'),
                                  type: notification.data?.type,
                                  date: notification.data?.date,
                                  message: notification.data?.message,
                                  featureName: notification.data?.featureName
                                })}
                              </p>
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  className={`p-1 rounded-md ${
                                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                  } text-green-500 transition-colors`}
                                  title={t('notifications.actions.markAsRead')}
                                >
                                  <CheckCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notification._id)}
                                className={`p-1 rounded-md ${
                                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                } text-red-500 transition-colors`}
                                title={t('notifications.actions.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`${
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              } border rounded-xl shadow-xl max-w-md w-full p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">{t('notifications.settings.title')}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('notifications.settings.pushNotifications.title')}</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'transactions', label: t('notifications.settings.pushNotifications.transactions.label'), description: t('notifications.settings.pushNotifications.transactions.description') },
                      { id: 'alert', label: t('notifications.settings.pushNotifications.alert.label'), description: t('notifications.settings.pushNotifications.alert.description') },
                      { id: 'system', label: t('notifications.settings.pushNotifications.system.label'), description: t('notifications.settings.pushNotifications.system.description') },
                      { id: 'news', label: t('notifications.settings.pushNotifications.news.label'), description: t('notifications.settings.pushNotifications.news.description') }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">{t('notifications.settings.emailNotifications.title')}</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'daily', label: t('notifications.settings.emailNotifications.daily.label'), description: t('notifications.settings.emailNotifications.daily.description') },
                      { id: 'marketing', label: t('notifications.settings.emailNotifications.marketing.label'), description: t('notifications.settings.emailNotifications.marketing.description') }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{setting.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    {t('notifications.settings.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Notifications;
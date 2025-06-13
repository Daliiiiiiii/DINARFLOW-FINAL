import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../lib/axios';
import { useTranslation } from 'react-i18next';

const NotificationList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    notifications, 
    setNotifications, 
    unreadCount, 
    setUnreadCount,
    showError 
  } = useNotification();
  const { t, i18n } = useTranslation();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter(n => !n.read).length);
    } catch (error) {
      showError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      showError('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      showError('Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      showError('Failed to mark all notifications as read');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      showError('Failed to delete all notifications');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('notifications.title')}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    title={t('notifications.actions.markAllRead')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteAllNotifications}
                    className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    title={t('notifications.actions.clearAll')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    title={t('common.close')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">{t('common.loading')}</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">{t('notifications.empty.title')}</div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {(
                            notification.title === 'New Support Ticket' ||
                            notification.title === 'New Support Message' ||
                            notification.title === 'Support Replied' ||
                            notification.title.startsWith('A new message was sent in ticket:')
                          ) ? (
                            notification.title
                          ) : (
                            t(notification.title, {
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
                            }) !== notification.title ? t(notification.title, {
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
                            }) : t('notifications.unknown')
                          )}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {(
                            notification.title === 'New Support Ticket' ||
                            notification.title === 'New Support Message' ||
                            notification.title === 'Support Replied' ||
                            notification.title.startsWith('A new message was sent in ticket:')
                          ) ? (
                            notification.message
                          ) : (
                            (() => {
                              const msg = t(notification.message, {
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
                              });
                              return msg.replace(/\{type\}/g, notification.data?.type ? t(`notifications.types.${notification.data?.type}`) || '' : '');
                            })()
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.createdAt).toLocaleString('en-US')}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            title={t('notifications.actions.markAsRead')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          title={t('notifications.actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationList; 
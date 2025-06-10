import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Rocket, Bell, Lock, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../lib/axios';
import ReactDOM from 'react-dom';

const ComingSoonOverlay = ({ title = "Coming Soon", description = "This feature is under development", onClose }) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // Check if user is already subscribed to this feature
    const checkSubscription = async () => {
      try {
        const response = await api.get('/api/notifications');
        const notifications = response.data;
        const featureNotification = notifications.find(
          n => n.type === 'feature' && n.data?.featureName === title
        );
        setIsSubscribed(!!featureNotification);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [title]);

  const handleNotifyMe = async () => {
    if (isSubscribed) return;

    try {
      setIsSubscribing(true);
      await api.post('/api/notifications/feature-subscribe', {
        featureName: title,
        featureDescription: description
      });
      setIsSubscribed(true);
      showSuccess('You will be notified when this feature is available!');
    } catch (error) {
      showError('Failed to subscribe to feature notification');
    } finally {
      setIsSubscribing(false);
    }
  };

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed top-0 left-0 right-0 bottom-0 w-full h-full backdrop-blur-sm bg-black/50 dark:bg-black/70 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial from-blue-500/20 via-blue-500/5 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-radial from-purple-500/20 via-purple-500/5 to-transparent blur-3xl"
        />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-12 h-12 text-white" />
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-14 mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400"
          >
            {description}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <button 
            onClick={handleNotifyMe}
            disabled={isSubscribing || isSubscribed}
            className={`w-full px-4 py-3 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubscribed 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
            }`}
          >
            <Bell className={`w-5 h-5 ${
              isSubscribing ? 'animate-pulse' : 
              isSubscribed ? 'text-green-200' : 
              'group-hover:animate-bounce'
            }`} />
            {isSubscribing ? 'Subscribing...' : 
             isSubscribed ? 'You are subscribed!' : 
             'Notify Me When Ready'}
          </button>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Coming soon</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Early Access</span>
            </div>
          </div>
        </motion.div>

        {/* Animated Progress Bar */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "65%" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </motion.div>
    </motion.div>
  );
  return ReactDOM.createPortal(overlay, document.body);
};

export default ComingSoonOverlay;
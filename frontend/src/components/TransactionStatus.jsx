import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowUpRight, X } from 'lucide-react';

const TransactionStatus = ({ show, type, message, onClose }) => {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000); // 3 seconds for success
      return () => clearTimeout(timer);
    } else if (type === 'error') {
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000); // 5 seconds for error
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative"
          >
            {/* Success circle background */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
            />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 30 }}
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </motion.div>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative"
          >
            {/* Error circle background */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
            />
            <XCircle className="w-12 h-12 text-red-500" />
          </motion.div>
        );
      case 'loading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            {/* Loading circle background */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
            />
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (type) {
      case 'success':
        return 'Transaction completed successfully';
      case 'error':
        return 'Transaction failed';
      case 'loading':
        return 'Processing transaction...';
      default:
        return 'Processing transaction...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="relative bg-gray-900/90 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full mx-4"
        >
          {/* Exit button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800/50 transition-colors z-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
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

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {getIcon()}
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent mb-2">
                {getMessage()}
              </h3>
              {type === 'loading' && (
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-sm text-gray-400"
                >
                  Please wait while we process your transaction
                </motion.div>
              )}
            </motion.div>

            {/* Progress bar for loading state */}
            {type === 'loading' && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mt-6"
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionStatus; 
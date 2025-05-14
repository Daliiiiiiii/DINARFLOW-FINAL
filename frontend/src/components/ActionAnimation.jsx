import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ActionAnimation = ({ show, type }) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'success':
        return 'Transaction completed successfully';
      case 'error':
        return 'Transaction failed';
      default:
        return 'Processing transaction...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl flex flex-col items-center gap-4"
        >
          {getIcon()}
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {getMessage()}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActionAnimation; 
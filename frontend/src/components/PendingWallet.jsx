import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Wallet as WalletIcon, Clock, Shield, Bell, ArrowRight, CheckCircle } from 'lucide-react';

const PendingWallet = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full mx-auto text-center"
        >
          {/* Animated Wallet Icon */}
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="relative w-32 h-32 mx-auto mb-8"
          >
            {/* Glowing background */}
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
              className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"
            />

            {/* Spinning rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500/50 border-r-purple-500/50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-4 rounded-full border-2 border-transparent border-t-purple-500/50 border-r-blue-500/50"
            />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <WalletIcon className="w-16 h-16 text-blue-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
          >
            Your Wallet is Being Created
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg mb-8 max-w-lg mx-auto"
          >
            Our team is setting up your secure digital wallet. You'll be notified as soon as it's ready for use.
          </motion.p>

          {/* Status Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-medium mb-2">Request Received</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your wallet request has been received</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <h3 className="font-medium mb-2">Processing</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Setting up security protocols</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-medium mb-2">Final Verification</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Security checks and activation</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/notifications"
              className={`px-6 py-3 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-2 group`}
            >
              <Bell className="w-5 h-5 text-blue-400" />
              <span>Enable Notifications</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/support"
              className={`px-6 py-3 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              Contact Support
            </Link>
          </motion.div>

          {/* Estimated Time */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Estimated time: 24-48 hours</span>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default PendingWallet;
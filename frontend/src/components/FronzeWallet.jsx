import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, MessageSquare, Clock, ArrowRight, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FrozenWallet = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full mx-auto text-center"
        >
          {/* Animated Lock Icon */}
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
              className="absolute inset-0 rounded-full bg-red-500/20 blur-xl"
            />

            {/* Spinning rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500/50 border-r-orange-500/50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-4 rounded-full border-2 border-transparent border-t-orange-500/50 border-r-red-500/50"
            />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-16 h-16 text-red-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4"
          >
            Your Wallet is Frozen
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg mb-8 max-w-lg mx-auto"
          >
            For your security, your wallet has been temporarily frozen due to suspicious activity. Please contact support to resolve this issue.
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
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-medium mb-2">Suspicious Activity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unusual login attempt detected</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
              <h3 className="font-medium mb-2">Security Check</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Account under review</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-medium mb-2">Resolution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting verification</p>
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
              to="/support"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 group"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/settings"
              className={`px-6 py-3 rounded-lg ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              Security Settings
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
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm">Average resolution time: 2-4 hours</span>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default FrozenWallet;
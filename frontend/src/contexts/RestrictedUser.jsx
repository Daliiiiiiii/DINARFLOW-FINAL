import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Ban, Shield, MessageSquare, Clock, ArrowRight, Lock, AlertTriangle, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const RestrictedUser = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full mx-auto text-center"
        >
          {/* Animated Ban Icon */}
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
            <motion.div
              animate={{
                scale: [1, 0.9, 1],
                rotate: [0, 10, -10, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Ban className="w-16 h-16 text-red-400" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4"
          >
            Account Restricted
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg mb-8 max-w-lg mx-auto"
          >
            Your account has been temporarily restricted due to suspicious activity or a violation of our terms of service.
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
              <h3 className="font-medium mb-2">Account Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Temporarily restricted</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
              <h3 className="font-medium mb-2">Security Review</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Under investigation</p>
            </div>

            <div className={`p-6 rounded-xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-medium mb-2">Required Action</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Document verification needed</p>
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

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm">Average resolution time: 24-48 hours</span>
          </motion.div>

          {/* Warning Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`mt-8 p-4 ${
              isDark ? 'bg-red-900/20' : 'bg-red-50'
            } rounded-lg max-w-lg mx-auto`}
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-200 font-medium">Limited Access</p>
                <p className="text-sm text-red-300 mt-1">
                  While your account is restricted, you won't be able to make transactions or access certain features.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
  );
};

export default RestrictedUser;
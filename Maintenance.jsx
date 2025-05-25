import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, Bell, ArrowRight, Shield, Server, Cog } from 'lucide-react';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
      </div>

      <div className="relative max-w-2xl w-full mx-auto text-center">
        {/* Animated Maintenance Icon */}
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

          {/* Spinning gears */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0"
          >
            <Cog className="absolute top-0 right-0 w-8 h-8 text-blue-400" />
            <Cog className="absolute bottom-0 left-0 w-12 h-12 text-purple-400" />
          </motion.div>

          {/* Center icon */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Wrench className="w-16 h-16 text-blue-400" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
        >
          System Maintenance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg mb-8 max-w-lg mx-auto"
        >
          We're currently upgrading our systems to serve you better. We'll be back shortly with improved features and performance.
        </motion.p>

        {/* Status Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Server className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium mb-2">System Upgrade</h3>
            <p className="text-sm text-gray-400">Enhancing platform stability</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <h3 className="font-medium mb-2">Security Update</h3>
            <p className="text-sm text-gray-400">Implementing new security features</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-medium mb-2">Progress</h3>
            <p className="text-sm text-gray-400">65% Complete</p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8"
        >
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </motion.div>

        {/* Notification Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 group">
            <Bell className="w-5 h-5" />
            <span>Notify When Ready</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Estimated completion: 2 hours</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Maintenance;
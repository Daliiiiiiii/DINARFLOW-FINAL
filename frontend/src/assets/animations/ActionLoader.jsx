import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';

const ActionLoader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center action-loader-overlay"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 shadow-xl"
          >
            <div className="relative w-20 h-20">
              {/* Glowing base */}
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
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500/50 border-r-purple-500/50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500/50 border-r-blue-500/50"
              />

              {/* Center icon */}
              <motion.div
                animate={{
                  scale: [1, 0.9, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <CircleDollarSign className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>

            {/* Processing text */}
            <motion.div
              animate={{
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full mt-4 whitespace-nowrap"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Processing...
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionLoader;
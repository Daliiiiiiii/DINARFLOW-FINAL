import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../ui/Logo';
import { X } from 'lucide-react';

const MobileMenu = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 bg-gray-950 z-50 md:hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <button 
                onClick={onClose}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col space-y-6">
              <a 
                href="#features" 
                className="text-gray-300 hover:text-white transition-colors text-lg"
                onClick={onClose}
              >
                Features
              </a>
              <a 
                href="#markets" 
                className="text-gray-300 hover:text-white transition-colors text-lg"
                onClick={onClose}
              >
                Markets
              </a>
              <a 
                href="#about" 
                className="text-gray-300 hover:text-white transition-colors text-lg"
                onClick={onClose}
              >
                About
              </a>
              <a 
                href="/login" 
                className="text-gray-300 hover:text-white transition-colors text-lg"
              >
                Login
              </a>
              <a 
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-center text-lg mt-4"
              >
                Get Started
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu; 
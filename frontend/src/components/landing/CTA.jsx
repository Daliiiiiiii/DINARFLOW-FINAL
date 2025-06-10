import React from 'react';
import { motion } from 'framer-motion';

const CTA = () => {
  return (
    <section className="py-24 px-4 md:px-8 lg:px-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-700/20 via-purple-700/10 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="container mx-auto relative"
      >
        <div className="max-w-4xl mx-auto text-center backdrop-blur-lg bg-gray-900/50 p-8 md:p-12 rounded-2xl border border-gray-800 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            Ready to Start Trading?
          </h2>
          <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of users who trust DinarFlow for their digital finance needs.
            Get started in minutes with our simple registration process.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-lg shadow-lg shadow-blue-900/30"
            >
              Create Free Account
            </a>
            <a
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-lg border border-white/10"
            >
              Sign In
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;

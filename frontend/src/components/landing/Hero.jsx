import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Wallet, ArrowUpRight } from 'lucide-react';

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div 
        style={{ y: y1, opacity }}
        className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"
      />
      <motion.div 
        style={{ y: y2, opacity }}
        className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"
      />

      <div className="container mx-auto px-4 md:px-8 lg:px-12 relative">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Tunisia's Digital Wallet Revolution
            </h1>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Send and receive TND instantly, or convert to DFLOW for enhanced financial opportunities. The future of Tunisian digital finance is here.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all flex items-center justify-center group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            </a>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all flex items-center justify-center group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Learn More
                <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            </a>
          </motion.div>
        </motion.div>

        {/* Floating Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Instant TND Transfers",
              description: "Send money to friends and family instantly, with zero fees between DinarFlow users.",
              delay: 0.6,
              translateY: [-20, 20]
            },
            {
              title: "Bank Transfers",
              description: "Transfer funds directly to any Tunisian bank account with competitive fees.",
              delay: 0.7,
              translateY: [20, -20]
            },
            {
              title: "DFLOW Trading",
              description: "Trade TND for DFLOW and access new financial opportunities in our ecosystem.",
              delay: 0.8,
              translateY: [-10, 10]
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: card.delay }}
              style={{ y: useTransform(scrollY, [0, 300], card.translateY) }}
              className="backdrop-blur-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6 text-blue-400"
              >
                <Wallet className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                {card.title}
              </h3>
              <p className="text-gray-400">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero; 
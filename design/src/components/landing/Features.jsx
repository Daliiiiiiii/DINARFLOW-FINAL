import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ShieldCheck, Rocket, Globe } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Trading',
      description: 'Access powerful trading tools, real-time charts, and advanced order types for optimal trading strategies.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Bank-Grade Security',
      description: 'Your funds are protected by state-of-the-art encryption and multi-layer security protocols.'
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Lightning Fast Transfers',
      description: 'Send and receive money instantly with zero fees. Experience seamless transactions across our network.'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Access',
      description: 'Trade and transfer funds globally with support for multiple currencies and payment methods.'
    }
  ];

  return (
    <section id="features" className="py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-gray-950 to-gray-900 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px] pointer-events-none" />
      
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
          >
            Why Choose DinarFlow
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Experience the next generation of digital finance with our cutting-edge platform
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all group"
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
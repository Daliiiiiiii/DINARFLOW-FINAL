import React from 'react';
import { motion } from 'framer-motion';
import { Coins, ShoppingBag, Gift, Ticket } from 'lucide-react';

const Ecosystem = () => {
  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: "USDT Staking",
      description: "Earn rewards by staking your USDT in our ecosystem",
      comingSoon: true
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Merchant Payments",
      description: "Pay at local stores using DinarFlow or USDT",
      comingSoon: true
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Rewards Program",
      description: "Earn cashback and rewards for using DinarFlow",
      comingSoon: true
    },
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Bill Payments",
      description: "Pay utilities and services directly from your wallet",
      comingSoon: true
    }
  ];

  return (
    <section className="py-32 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-blue-500/10 via-purple-500/10 to-transparent blur-3xl" />
      </div>

      <div className="container mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
            USDT Ecosystem
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore the growing ecosystem of services powered by USDT
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all relative">
                <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  {feature.title}
                  {feature.comingSoon && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;

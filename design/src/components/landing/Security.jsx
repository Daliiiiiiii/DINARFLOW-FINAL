import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, UserCheck } from 'lucide-react';

const Security = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Grade Security",
      description: "Your funds are protected by state-of-the-art encryption and security protocols"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Secure Storage",
      description: "Assets are stored in secure, offline cold storage facilities"
    },
    {
      icon: <Key className="w-8 h-8" />,
      title: "2FA Protection",
      description: "Enable two-factor authentication for enhanced account security"
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Identity Verification",
      description: "All users undergo thorough verification to prevent fraud"
    }
  ];

  return (
    <section className="py-32 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
      {/* Animated Security Pattern Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent"
        />
      </div>

      <div className="container mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent">
            Security First
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your security is our top priority. We implement multiple layers of protection to keep your assets safe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all">
                <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-green-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 p-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700"
        >
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">Protected by Insurance</h3>
            <p className="text-gray-400">
              Your funds are covered by our comprehensive insurance policy, providing additional peace of mind for your digital assets.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Security;
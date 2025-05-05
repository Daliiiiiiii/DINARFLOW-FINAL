import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Smartphone, ArrowRight, CreditCard, Wallet, ArrowDown } from 'lucide-react';

const HowItWorks = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const steps = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Create Your Wallet",
      description: "Sign up in minutes with just your phone number and ID. Our streamlined verification process gets you started quickly and securely.",
      color: "from-blue-600 to-blue-400"
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Add TND",
      description: "Load your wallet instantly using your bank card or account. Your funds are immediately available for use across the DinarFlow ecosystem.",
      color: "from-purple-600 to-purple-400"
    },
    {
      icon: <ArrowRight className="w-8 h-8" />,
      title: "Send & Receive",
      description: "Transfer money instantly to other DinarFlow users with zero fees. Send to any bank account in Tunisia with competitive rates.",
      color: "from-green-600 to-green-400"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Trade DFLOW",
      description: "Convert your TND to DFLOW and unlock new financial opportunities. Trade, stake, and earn rewards in our growing ecosystem.",
      color: "from-orange-600 to-orange-400"
    }
  ];

  return (
    <section 
      ref={containerRef}
      className="min-h-[400vh] relative py-20"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 relative">
          {/* Title */}
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1]),
              y: useTransform(scrollYProgress, [0, 0.1], [50, 0])
            }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              How DinarFlow Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Experience the future of digital payments in Tunisia
            </p>
            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [0.1, 0.2], [1, 0]),
                scale: useTransform(scrollYProgress, [0.1, 0.2], [1, 0.8])
              }}
              className="mt-8"
            >
              <ArrowDown className="w-6 h-6 mx-auto text-blue-400 animate-bounce" />
            </motion.div>
          </motion.div>

          {/* Steps */}
          {steps.map((step, index) => {
            const startProgress = 0.1 + (index * 0.2);
            const endProgress = startProgress + 0.15;

            return (
              <motion.div
                key={step.title}
                style={{
                  opacity: useTransform(
                    scrollYProgress,
                    [startProgress, startProgress + 0.05, endProgress - 0.05, endProgress],
                    [0, 1, 1, 0]
                  ),
                  scale: useTransform(
                    scrollYProgress,
                    [startProgress, startProgress + 0.05, endProgress - 0.05, endProgress],
                    [0.8, 1, 1, 0.8]
                  ),
                  y: useTransform(
                    scrollYProgress,
                    [startProgress, startProgress + 0.05, endProgress - 0.05, endProgress],
                    [100, 0, 0, -100]
                  )
                }}
                className="absolute inset-x-4 md:inset-x-8 lg:inset-x-12"
              >
                <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-gray-700">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-20 flex items-center justify-center text-white`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Apple, 
  Smartphone as Android, 
  ArrowRight, 
  Wallet, 
  CreditCard,
  Bell,
  QrCode,
  Fingerprint,
  LineChart,
  Shield
} from 'lucide-react';

const MobileApp = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const features = [
    {
      icon: Wallet,
      title: "Instant Transfers",
      description: "Send money in seconds",
      color: "blue",
      position: { right: "-4rem", top: "15%" },
      scrollProgress: [0.3, 0.4]
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Bank-grade security",
      color: "purple",
      position: { left: "-4rem", bottom: "40%" },
      scrollProgress: [0.35, 0.45]
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Real-time alerts",
      color: "green",
      position: { right: "-4rem", top: "40%" },
      scrollProgress: [0.4, 0.5]
    },
    {
      icon: QrCode,
      title: "QR Payments",
      description: "Scan & pay instantly",
      color: "orange",
      position: { left: "-4rem", top: "25%" },
      scrollProgress: [0.45, 0.55]
    },
    {
      icon: Fingerprint,
      title: "Biometric Security",
      description: "Extra layer of protection",
      color: "red",
      position: { right: "-4rem", bottom: "30%" },
      scrollProgress: [0.5, 0.6]
    },
    {
      icon: LineChart,
      title: "Analytics Dashboard",
      description: "Track your spending",
      color: "teal",
      position: { left: "-4rem", bottom: "20%" },
      scrollProgress: [0.55, 0.65]
    },
    {
      icon: Shield,
      title: "Fraud Protection",
      description: "24/7 monitoring",
      color: "indigo",
      position: { right: "-4rem", bottom: "15%" },
      scrollProgress: [0.6, 0.7]
    }
  ];

  return (
    <section 
      ref={containerRef}
      className="min-h-screen py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-gray-900 to-gray-950 relative"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-blue-500/10 via-purple-500/10 to-transparent blur-3xl" />
      </div>

      <div className="container mx-auto relative">
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-screen sticky top-0">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              DinarFlow Mobile App
            </h2>
            <p className="text-gray-400 text-lg">
              Take control of your finances on the go. Our mobile app is coming soon to iOS and Android devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
                <Apple className="w-6 h-6" />
                <span className="font-medium">iOS App</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
                <Android className="w-6 h-6" />
                <span className="font-medium">Android App</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>




          </motion.div>

          {/* App Preview */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-[9/19] rounded-[3rem] border-[14px] border-gray-800 overflow-hidden relative"
            >
              <img
                src="https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=1280&dpr=2"
                alt="DinarFlow Mobile App"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>

            {/* Floating Features */}
            {features.map((feature, index) => {
              const opacity = useTransform(
                scrollYProgress,
                feature.scrollProgress,
                [0, 1]
              );
              const x = useTransform(
                scrollYProgress,
                feature.scrollProgress,
                [20, 0]
              );

              return (
                <motion.div
                  key={feature.title}
                  style={{ 
                    opacity,
                    x,
                    ...feature.position
                  }}
                  className="absolute bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{feature.title}</div>
                      <div className="text-xs text-gray-400">{feature.description}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp; 
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Stats = () => {
  const statsRef = useRef(null);
  const [animateStats, setAnimateStats] = useState(false);

  // Stats data
  const stats = [
    { label: 'Active Users', value: 150000, prefix: '', suffix: '+' },
    { label: 'Daily Volume', value: 2500000, prefix: 'TND ', suffix: '' },
    { label: '24h Transactions', value: 45000, prefix: '', suffix: '+' },
    { label: 'Countries', value: 15, prefix: '', suffix: '' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.75 && rect.bottom >= 0) {
          setAnimateStats(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on component mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated counter hook
  const useCounter = (end, duration = 2) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (!animateStats) return;
      
      let startTime = null;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);
        
        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      
      requestAnimationFrame(animate);
    }, [end, duration, animateStats]);
    
    return count.toLocaleString();
  };

  return (
    <section 
      ref={statsRef}
      className="py-20 bg-gradient-to-b from-gray-900 to-gray-950"
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: animateStats ? 1 : 0, y: animateStats ? 0 : 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.prefix}{useCounter(stat.value)}{stat.suffix}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats; 
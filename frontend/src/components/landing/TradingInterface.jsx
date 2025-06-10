import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TradingInterface = () => {
  const [activeTab, setActiveTab] = useState('trade');

  // Trading pairs data
  const tradingPairs = [
    { name: 'USDT/TND', price: '0.2500', change: '+2.5%', volume: '125,000' },
    { name: 'BTC/TND', price: '145,230', change: '-1.2%', volume: '890,000' },
    { name: 'ETH/TND', price: '7,850', change: '+3.8%', volume: '456,000' },
    { name: 'SOL/TND', price: '2,450', change: '+5.2%', volume: '223,000' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.6 }}
      className="mt-16 bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-gray-700"
    >
      <div className="flex items-center gap-4 p-4 bg-gray-800/80 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('trade')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'trade' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'markets' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Markets
        </button>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left pb-4 pl-2">Pair</th>
                <th className="text-right pb-4">Price</th>
                <th className="text-right pb-4">24h Change</th>
                <th className="text-right pb-4">Volume</th>
                <th className="text-right pb-4 pr-2">Trade</th>
              </tr>
            </thead>
            <tbody>
              {tradingPairs.map((pair, index) => (
                <motion.tr 
                  key={pair.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                >
                  <td className="py-4 pl-2 font-medium">{pair.name}</td>
                  <td className="text-right py-4">{pair.price}</td>
                  <td className={`text-right py-4 ${
                    pair.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {pair.change}
                  </td>
                  <td className="text-right py-4 text-gray-400">{pair.volume}</td>
                  <td className="text-right py-4 pr-2">
                    <a
                      href="/register"
                      className="inline-block px-4 py-2 bg-blue-600/20 hover:bg-blue-600 rounded-lg text-blue-400 hover:text-white transition-colors"
                    >
                      Trade
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default TradingInterface;
import React from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign } from 'lucide-react';

const LoadingSpinner = () => {
  const loadingText = "Loading...".split("");

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const letterAnimation = {
    hidden: { 
      opacity: 0,
      y: 20,
    },
    show: { 
      opacity: 1,
      y: 0,
      transition: {
        ease: "easeInOut",
        duration: 0.8,
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-[#0A0F1C] z-50 flex items-center justify-center overflow-hidden loading-spinner-overlay">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-900 to-purple-950" />
        
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            opacity: [0.4, 0.6, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial from-blue-500/30 via-blue-500/5 to-transparent blur-2xl"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-radial from-purple-500/30 via-purple-500/5 to-transparent blur-2xl"
        />

        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        {/* Moving gradient accent */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-conic from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-3xl opacity-50"
        />
      </div>

      <div className="relative">
        {/* Animated logo container */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="relative w-32 h-32"
        >
          {/* Glowing rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                ease: "linear",
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="absolute inset-0 rounded-full border-2 border-blue-500/30"
              style={{
                filter: "blur(2px)",
              }}
            />
          ))}

          {/* Main logo circle */}
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <CircleDollarSign className="w-12 h-12 text-white drop-shadow-lg" />
              </motion.div>
            </div>
          </motion.div>

          {/* Orbiting particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.1,
              }}
              className="absolute inset-0"
              style={{ transformOrigin: "center" }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{
                  top: "50%",
                  left: i % 2 === 0 ? "-4px" : "calc(100% - 4px)",
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Animated loading text */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="absolute left-1/2 -translate-x-1/2 mt-12 flex items-baseline"
        >
          {loadingText.map((char, index) => (
            <motion.span
              key={index}
              variants={letterAnimation}
              className="inline-block text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent px-[1px]"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
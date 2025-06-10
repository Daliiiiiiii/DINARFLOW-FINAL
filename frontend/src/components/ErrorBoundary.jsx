import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 50,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-gradient-conic from-red-500/10 via-purple-500/10 to-red-500/10 blur-3xl opacity-50"
            />
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Error Icon Animation */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative w-32 h-32 mx-auto mb-8"
              >
                {/* Animated rings */}
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
                    className="absolute inset-0 rounded-full border-2 border-red-500/30"
                    style={{
                      filter: "blur(2px)",
                    }}
                  />
                ))}

                {/* Main error icon */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-red-600 to-purple-600 shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center"
                >
                  <AlertTriangle className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent mb-4"
              >
                Something Went Wrong
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-gray-400 mb-8 max-w-md mx-auto"
              >
                We encountered an unexpected error. Please try again or return to the home page.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to="/"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Back to Home
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                </Link>
                <button
                  onClick={this.handleRefresh}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center justify-center gap-2 group"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center justify-center gap-2 group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                  Go Back
                </button>
              </motion.div>

              {/* Technical Details */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-12 text-center"
              >
                <button
                  onClick={() => {/* Toggle technical details */}}
                  className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
                >
                  Show Technical Details
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary; 
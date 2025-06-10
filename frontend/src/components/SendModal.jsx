import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ArrowRight, AlertCircle, CheckCircle, Loader2, Upload, Camera, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QrScanner from 'qr-scanner';

const SendModal = ({ isDark, selectedNetwork, sendAmount, setSendAmount, sendAddress, setSendAddress, handleSend, onClose, isSending, transactionStatus, transactionMessage }) => {
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      QrScanner.scanImage(file)
        .then(result => {
          setSendAddress(result);
          toast.success('Address extracted from QR code');
        })
        .catch(error => {
          console.error('Error scanning QR code:', error);
          toast.error('Failed to read QR code. Please make sure it contains a valid address.');
        });
    }
  };

  const startScanner = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera access is not supported in your browser');
      return;
    }

    setIsScanning(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scannerRef.current = new QrScanner(
            videoRef.current,
            result => {
              const address = result.data;
              setSendAddress(address);
              stopScanner();
              toast.success('Address scanned successfully');
            },
            {
              returnDetailedScanResult: true,
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          scannerRef.current.start();
        }
      })
      .catch(error => {
        console.error('Error accessing camera:', error);
        toast.error('Failed to access camera');
        setIsScanning(false);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Clean up scanner when component unmounts
  React.useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const getNetworkIcon = (networkId) => {
    switch (networkId) {
      case 'ethereum': return '⟠';
      case 'bsc': return '⛓️';
      case 'tron': return '🔷';
      case 'ton': return '💎';
      case 'solana': return '☀️';
      case 'polygon': return '⬡';
      case 'arbitrum': return '🔷';
      default: return '🌐';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`${
          isDark ? 'bg-gray-900/90' : 'bg-white/90'
        } rounded-2xl w-full max-w-md relative overflow-hidden backdrop-blur-xl border ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -inset-[100%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            >
              Send USDT
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-6">
            {/* Network Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-500/10 dark:bg-blue-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getNetworkIcon(selectedNetwork.id)}</div>
                <div>
                  <div className="font-medium">{selectedNetwork.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Network Fee: {selectedNetwork.fee} • Time: {selectedNetwork.time}
                  </div>
                </div>
              </div>
            </motion.div>

            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSend(e);
            }}>
              {/* Amount Input */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Amount (USDT)
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-50 transition-opacity ${
                    isAmountFocused ? 'opacity-75' : 'opacity-0'
                  }`} />
                  <div className="relative">
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      onFocus={() => setIsAmountFocused(true)}
                      onBlur={() => setIsAmountFocused(false)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="0.00"
                      disabled={isSending}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      USDT
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Address Input with QR Scanning */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Recipient Address
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-50 transition-opacity ${
                    isAddressFocused ? 'opacity-75' : 'opacity-0'
                  }`} />
                  <div className="relative">
                    <input
                      type="text"
                      value={sendAddress}
                      onChange={(e) => setSendAddress(e.target.value)}
                      onFocus={() => setIsAddressFocused(true)}
                      onBlur={() => setIsAddressFocused(false)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 transition-all pr-24"
                      placeholder={`Enter ${selectedNetwork.name} address`}
                      disabled={isSending}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startScanner}
                        className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-lg hover:shadow-xl transition-all"
                        title="Scan QR code"
                      >
                        <Camera className="w-5 h-5" />
                      </motion.button>
                      <label className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5" />
                      </label>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedNetwork.name} addresses {selectedNetwork.id === 'ethereum' || selectedNetwork.id === 'bsc' || selectedNetwork.id === 'arbitrum' || selectedNetwork.id === 'polygon' ? 'start with 0x' : 
                   selectedNetwork.id === 'tron' ? 'start with T' :
                   selectedNetwork.id === 'solana' ? 'are base58 encoded' :
                   selectedNetwork.id === 'ton' ? 'start with UQ' : ''}
                </p>
              </motion.div>

              {/* QR Scanner Modal */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="relative w-full max-w-md"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                        />
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={stopScanner}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      >
                        <X className="w-6 h-6 text-white" />
                      </motion.button>
                      <div className="mt-4 text-center text-white">
                        Position the QR code within the frame
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transaction Status */}
              <AnimatePresence>
                {transactionStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-4 rounded-xl ${
                      transactionStatus === 'error' 
                        ? 'bg-red-500/10 dark:bg-red-500/20' 
                        : transactionStatus === 'success'
                        ? 'bg-green-500/10 dark:bg-green-500/20'
                        : 'bg-blue-500/10 dark:bg-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {transactionStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : transactionStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      <span className="text-sm">
                        {transactionMessage}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3 mt-6"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSending || !sendAmount || !sendAddress}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send USDT
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(SendModal); 
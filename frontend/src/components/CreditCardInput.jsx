import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, Calendar, Lock, DollarSign, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const CreditCardInput = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    amount: ''
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastExpiry, setLastExpiry] = useState('');
  const [amountError, setAmountError] = useState('');
  const [buttonState, setButtonState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const expiryRef = useRef();

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleExpiryKeyDown = (e) => {
    const { value, selectionStart } = e.target;
    if (
      e.key === 'Backspace' &&
      value[selectionStart - 1] === '/' &&
      value.length === 5 &&
      selectionStart === 3
    ) {
      e.preventDefault();
      const newValue = value.slice(0, 2);
      setFormData({ ...formData, expiry: newValue });
      setLastExpiry(newValue);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === '') {
      setFormData({ ...formData, amount: '' });
      setAmountError('');
      return;
    }

    if (isNaN(numValue)) {
      setAmountError('Please enter a valid amount');
      return;
    }

    if (numValue < 1) {
      setAmountError('Minimum amount is 1 TND');
      return;
    }

    if (numValue > 1000) {
      setAmountError('Maximum amount is 1000 TND');
      return;
    }

    setFormData({ ...formData, amount: value });
    setAmountError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'number') {
      // If first character is not a digit, don't update
      if (value.length === 1 && !/^\d$/.test(value)) {
        return;
      }
      setFormData({ ...formData, [name]: formatCardNumber(value) });
    } else if (name === 'expiry') {
      const v = value.replace(/\D/g, '').slice(0, 4);
      // If first digit is 2 or higher, clear immediately
      if (v.length === 1 && parseInt(v[0], 10) > 1) {
        setFormData({ ...formData, [name]: '' });
        setLastExpiry('');
        return;
      }
      if (v.length >= 2) {
        let mm = v.slice(0, 2);
        let yy = v.slice(2);
        // Validate month
        if (mm.length === 1 && parseInt(mm[0], 10) > 1) {
          setFormData({ ...formData, [name]: '' });
          setLastExpiry('');
          return;
        }
        if (mm.length === 2 && (parseInt(mm, 10) < 1 || parseInt(mm, 10) > 12)) {
          setFormData({ ...formData, [name]: mm[0] });
          setLastExpiry(mm[0]);
          return;
        }
        // Validate year if present
        if (yy.length === 1 && parseInt(yy[0], 10) < 2) {
          setFormData({ ...formData, [name]: `${mm}/` });
          setLastExpiry(`${mm}/`);
          return;
        }
        if (yy.length === 2 && parseInt(yy, 10) < 25) {
          setFormData({ ...formData, [name]: `${mm}/${yy[0]}` });
          setLastExpiry(`${mm}/${yy[0]}`);
          return;
        }
        const formatted = `${mm}${yy ? '/' + yy : ''}`;
        setFormData({ ...formData, [name]: formatted });
        setLastExpiry(formatted);
      } else {
        setFormData({ ...formData, [name]: v });
        setLastExpiry(v);
      }
    } else if (name === 'cvv') {
      // Only allow numbers for CVV
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData({ ...formData, [name]: numericValue });
    } else if (name === 'name') {
      // Only allow letters and spaces for card holder name
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({ ...formData, [name]: lettersOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 1 || amount > 1000) {
      setAmountError('Please enter a valid amount between 1 and 1000 TND');
      return;
    }

    // Validate card details
    if (!formData.number || !formData.name || !formData.expiry || !formData.cvv) {
      return;
    }

    setButtonState('loading');

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setButtonState('success');
      // Reset form after success
      setTimeout(() => {
        setFormData({
          number: '',
          name: '',
          expiry: '',
          cvv: '',
          amount: ''
        });
        setButtonState('idle');
        onClose();
      }, 2000);
    } catch (error) {
      setButtonState('error');
      // Reset error state after 2 seconds
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl max-w-md w-full overflow-hidden"
          >
            {/* Card Preview */}
            <div className="relative h-56 bg-gradient-to-br from-blue-600 to-purple-600 p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden">
                  <div className="absolute top-0 right-0">
                    <CreditCard className="w-10 h-10 text-white/80" />
                  </div>
                  {/* Gray rectangle for card number */}
                  <div className="absolute left-0 right-0 top-12 mx-6 h-10 bg-white/20 rounded-md flex items-center justify-center">
                    <span className="text-2xl md:text-3xl text-white font-mono tracking-wider overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
                      {(formData.number || '•••• •••• •••• ••••').slice(0, 19)}
                    </span>
                  </div>
                  {/* Card holder and expiry at the bottom */}
                  <div className="absolute left-0 right-0 bottom-2 px-6 flex justify-between items-end">
                    <div>
                      <div className="text-xs text-white/60 uppercase">Card Holder</div>
                      <div className="text-white font-medium break-all max-w-[120px]">
                        {formData.name || 'YOUR NAME'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 uppercase">Expires</div>
                      <div className="text-white font-medium">
                        {formData.expiry || 'MM/YY'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 backface-hidden"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute top-8 w-full h-12 bg-black/30" />
                  <div className="absolute top-24 right-8 w-16 h-10 bg-white/20 rounded flex items-center justify-center text-white">
                    {formData.cvv || 'CVV'}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount (TND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className={`w-full pl-4 pr-10 py-2 bg-gray-800/50 border ${
                      amountError ? 'border-red-500' : 'border-gray-700'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter amount (1-1000 TND)"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">د.ت</span>
                </div>
                {amountError && (
                  <p className="mt-1 text-sm text-red-500">{amountError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    maxLength="19"
                    className="w-full pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234 5678 9012 3456"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleChange}
                      onKeyDown={handleExpiryKeyDown}
                      maxLength="5"
                      ref={expiryRef}
                      className="w-full pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MM/YY"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleChange}
                      maxLength="4"
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      className="w-full pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={buttonState !== 'idle'}
                className={`w-full py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                  buttonState === 'idle' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : buttonState === 'loading'
                    ? 'bg-blue-600 text-white'
                    : buttonState === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                <AnimatePresence mode="wait">
                  {buttonState === 'idle' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="block"
                    >
                      Top Up Wallet
                    </motion.span>
                  )}
                  {buttonState === 'loading' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </motion.div>
                  )}
                  {buttonState === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Success!
                    </motion.div>
                  )}
                  {buttonState === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Failed to Process
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreditCardInput; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, CreditCard, CheckCircle, ArrowRight, Building2, Smartphone, Cast as Cash, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const P2PProfileSetup = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    paymentMethods: [],
    paymentDetails: {
      tnd_wallet: {
        balance: '0'
      },
      bank: {
        bankName: '',
        accountNumber: '',
        accountHolder: ''
      },
      flouci: {
        number: ''
      },
      d17: {
        number: ''
      },
      postepay: {
        accountNumber: '',
        accountHolder: ''
      },
      phone_balance: {
        provider: '',
        number: ''
      },
      western_union: {
        location: ''
      },
      moneygram: {
        location: ''
      }
    }
  });

  // Add predefined banks list
  const banks = [
    { id: 'biat', name: 'BIAT' },
    { id: 'attijari', name: 'Attijari' },
    { id: 'bte', name: 'BTE' },
    { id: 'zitouna', name: 'Zitouna' },
    { id: 'others', name: 'Others' }
  ];

  // Add phone providers
  const phoneProviders = [
    { id: 'tt', name: 'Tunisie Telecom' },
    { id: 'orange', name: 'Orange' },
    { id: 'ooredoo', name: 'Ooredoo' }
  ];

  // Add useEffect to handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]); // Add onClose as a dependency

  // Add validation function
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.nickname.trim().length > 0;
      case 2:
        return formData.paymentMethods.length > 0;
      case 3:
        // Check if all selected payment methods have their required details
        return formData.paymentMethods.every(method => {
          switch (method) {
            case 'tnd_wallet':
              return true; // No additional details needed for TND wallet
            case 'bank':
              return formData.paymentDetails.bank.bankName &&
                     formData.paymentDetails.bank.accountNumber &&
                     formData.paymentDetails.bank.accountHolder;
            case 'flouci':
            case 'd17':
            case 'postepay':
            case 'phone_balance':
              return formData.paymentDetails[method].number;
            case 'western_union':
            case 'moneygram':
              return formData.paymentDetails[method].location;
            default:
              return false;
          }
        });
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Add error states
  const [errors, setErrors] = useState({
    nickname: false,
    paymentMethods: false,
    paymentDetails: {
      tnd_wallet: {
        balance: false
      },
      bank: {
        bankName: false,
        accountNumber: false,
        accountHolder: false
      },
      flouci: {
        number: false
      },
      d17: {
        number: false
      },
      postepay: {
        accountNumber: false,
        accountHolder: false
      },
      phone_balance: {
        number: false
      },
      western_union: {
        location: false
      },
      moneygram: {
        location: false
      }
    }
  });

  // Add validation functions
  const validatePhoneNumber = (number) => {
    const digitsOnly = number.replace(/\D/g, '');
    return digitsOnly.length <= 8;
  };

  const validateName = (name) => {
    return !/\d/.test(name);
  };

  // Update handleInputChange to include validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');

    if (section === 'paymentDetails') {
      const [method, detail] = field.split('.');
      setFormData(prev => ({
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
          [method]: {
            ...prev.paymentDetails[method],
            [detail]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Update the phone number input fields
  const renderPhoneNumberInput = (name, value, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Phone Number <span className="text-red-400">*</span>
      </label>
      <input
        type="tel"
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
        placeholder={placeholder}
      />
    </div>
  );

  // Update the name input fields
  const renderNameInput = (name, value, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Account Holder Name <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
        placeholder={placeholder}
      />
      <p className="mt-1 text-sm text-gray-500">No numbers allowed</p>
    </div>
  );

  // Add validation before proceeding to next step
  const handleNextStep = () => {
    if (!isStepValid()) {
      // Show error toast
      toast.error('Please fill in all required fields');
      
      // Set error states
      switch (step) {
        case 1:
          setErrors(prev => ({ ...prev, nickname: !formData.nickname.trim() }));
          break;
        case 2:
          setErrors(prev => ({ ...prev, paymentMethods: formData.paymentMethods.length === 0 }));
          break;
        case 3:
          formData.paymentMethods.forEach(method => {
            switch (method) {
              case 'bank':
                setErrors(prev => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails,
                    bank: {
                      ...prev.paymentDetails.bank,
                      bankName: !formData.paymentDetails.bank.bankName.trim(),
                      accountNumber: !formData.paymentDetails.bank.accountNumber.trim(),
                      accountHolder: !formData.paymentDetails.bank.accountHolder.trim()
                    }
                  }
                }));
                break;
              case 'flouci':
              case 'd17':
              case 'postepay':
              case 'phone_balance':
                setErrors(prev => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails,
                    [method]: {
                      ...prev.paymentDetails[method],
                      number: !formData.paymentDetails[method].number.trim()
                    }
                  }
                }));
                break;
              case 'western_union':
              case 'moneygram':
                setErrors(prev => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails,
                    [method]: {
                      ...prev.paymentDetails[method],
                      location: !formData.paymentDetails[method].location.trim()
                    }
                  }
                }));
                break;
            }
          });
          break;
      }
      return;
    }
    setStep(prev => Math.min(steps.length, prev + 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formattedData = {
        nickname: formData.nickname,
        paymentMethods: formData.paymentMethods.map(method => method.toLowerCase()),
        tndWallet: formData.paymentMethods.includes('tnd_wallet') ? {
          balance: formData.paymentDetails.tnd_wallet.balance
        } : undefined,
        bankDetails: formData.paymentMethods.includes('bank') ? {
          bankName: formData.paymentDetails.bank.bankName,
          accountNumber: formData.paymentDetails.bank.accountNumber,
          accountHolder: formData.paymentDetails.bank.accountHolder
        } : undefined,
        mobileMoney: {
          flouci: formData.paymentMethods.includes('flouci') ? {
            number: formData.paymentDetails.flouci.number
          } : undefined,
          d17: formData.paymentMethods.includes('d17') ? {
            number: formData.paymentDetails.d17.number
          } : undefined,
          postepay: formData.paymentMethods.includes('postepay') ? {
            accountNumber: formData.paymentDetails.postepay.accountNumber,
            accountHolder: formData.paymentDetails.postepay.accountHolder
          } : undefined,
          phone_balance: formData.paymentMethods.includes('phone_balance') ? {
            provider: formData.paymentDetails.phone_balance.provider,
            number: formData.paymentDetails.phone_balance.number
          } : undefined
        }
      };
      
      console.log('Request Payload:', JSON.stringify(formattedData, null, 2));
      
      const response = await axios.post('/api/p2p/profile', formattedData);
      console.log('Response:', response.data);
      setShowSuccess(true);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        toast.success('Profile created successfully!');
        onClose();
        navigate('/p2p');
      }, 2000);
    } catch (error) {
      console.error('Error creating profile:', error);
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
        
        if (error.response.status === 400 && error.response.data.message === 'User already has a P2P profile') {
          toast.error('You already have a P2P profile');
          onClose();
          navigate('/p2p');
          return;
        }
      }
      toast.error(error.response?.data?.message || 'Failed to create profile');
    }
  };

  const steps = [
    {
      title: "Welcome to P2P Trading",
      description: "Let's set up your profile to start trading USDT",
      icon: User,
      color: "blue"
    },
    {
      title: "Choose Payment Methods",
      description: "Select the payment methods you'll accept",
      icon: CreditCard,
      color: "purple"
    },
    {
      title: "Add Payment Details",
      description: "Enter your payment account information",
      icon: Cash,
      color: "green"
    },
    {
      title: "Review & Complete",
      description: "Review your information and complete setup",
      icon: CheckCircle,
      color: "yellow"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl bg-gray-900/50 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-4"
              >
                Profile Created Successfully!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-center"
              >
                You can now start creating offers and trading USDT
              </motion.p>
            </motion.div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="h-1 bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / steps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>

              <div className="p-8 flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{steps[step - 1].title}</h2>
                    <p className="text-gray-400 mt-1">{steps[step - 1].description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {steps.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-2 h-2 rounded-full ${
                          i + 1 === step ? 'bg-blue-500' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {step === 1 && (
                        <div className="space-y-6">
                          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                  Nickname <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="nickname"
                                  value={formData.nickname}
                                  onChange={handleInputChange}
                                  className={`w-full px-4 py-3 bg-white/5 border ${
                                    errors.nickname ? 'border-red-500/50' : 'border-white/10'
                                  } rounded-xl focus:outline-none focus:border-blue-500/50`}
                                  placeholder="Enter your trading nickname"
                                />
                                {errors.nickname && (
                                  <p className="mt-1 text-sm text-red-400">Nickname is required</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-6">
                          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-medium text-white mb-4">
                              Payment Methods <span className="text-red-400">*</span>
                            </h3>
                            {errors.paymentMethods && (
                              <p className="mb-4 text-sm text-red-400">Please select at least one payment method</p>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                'tnd_wallet',
                                'bank',
                                'flouci',
                                'd17',
                                'postepay',
                                'phone_balance',
                                'western_union',
                                'moneygram'
                              ].map((method) => (
                                <motion.button
                                  key={method}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      paymentMethods: prev.paymentMethods.includes(method)
                                        ? prev.paymentMethods.filter(m => m !== method)
                                        : [...prev.paymentMethods, method]
                                    }));
                                  }}
                                  className={`p-4 rounded-xl border ${
                                    formData.paymentMethods.includes(method)
                                      ? 'bg-blue-500/10 border-blue-500/20'
                                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                                  } transition-all`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${
                                      formData.paymentMethods.includes(method)
                                        ? 'bg-blue-500/20'
                                        : 'bg-white/5'
                                    } flex items-center justify-center`}>
                                      {method === 'tnd_wallet' ? (
                                        <Wallet className="w-5 h-5 text-blue-400" />
                                      ) : method === 'bank' ? (
                                        <Building2 className="w-5 h-5 text-blue-400" />
                                      ) : method === 'flouci' || method === 'd17' ? (
                                        <Smartphone className="w-5 h-5 text-blue-400" />
                                      ) : method === 'phone_balance' ? (
                                        <Smartphone className="w-5 h-5 text-blue-400" />
                                      ) : method === 'cash' ? (
                                        <Cash className="w-5 h-5 text-blue-400" />
                                      ) : (
                                        <CreditCard className="w-5 h-5 text-blue-400" />
                                      )}
                                    </div>
                                    <span className="text-white">
                                      {method === 'tnd_wallet' ? 'Dinarflow TND Wallet' :
                                       method === 'flouci' ? 'Flouci App' :
                                       method === 'd17' ? 'D17 App' :
                                       method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-6">
                          {formData.paymentMethods.includes('bank') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">Bank Details</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Bank Name <span className="text-red-400">*</span>
                                  </label>
                                  <select
                                    name="paymentDetails.bank.bankName"
                                    value={formData.paymentDetails.bank.bankName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                  >
                                    <option value="">Select a bank</option>
                                    {banks.map(bank => (
                                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Account Number <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="paymentDetails.bank.accountNumber"
                                    value={formData.paymentDetails.bank.accountNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                    placeholder="Enter account number"
                                  />
                                </div>
                                {renderNameInput(
                                  'paymentDetails.bank.accountHolder',
                                  formData.paymentDetails.bank.accountHolder,
                                  'Enter account holder name'
                                )}
                              </div>
                            </div>
                          )}

                          {formData.paymentMethods.includes('flouci') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">Flouci Details</h3>
                              {renderPhoneNumberInput(
                                'paymentDetails.flouci.number',
                                formData.paymentDetails.flouci.number,
                                'Enter Flouci phone number'
                              )}
                            </div>
                          )}

                          {formData.paymentMethods.includes('d17') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">D17 Details</h3>
                              {renderPhoneNumberInput(
                                'paymentDetails.d17.number',
                                formData.paymentDetails.d17.number,
                                'Enter D17 phone number'
                              )}
                            </div>
                          )}

                          {formData.paymentMethods.includes('postepay') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">Postepay Details</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Account Number <span className="text-red-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="paymentDetails.postepay.accountNumber"
                                    value={formData.paymentDetails.postepay.accountNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                    placeholder="Enter Postepay account number"
                                  />
                                </div>
                                {renderNameInput(
                                  'paymentDetails.postepay.accountHolder',
                                  formData.paymentDetails.postepay.accountHolder,
                                  'Enter account holder name'
                                )}
                              </div>
                            </div>
                          )}

                          {formData.paymentMethods.includes('phone_balance') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">Phone Balance Details</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Provider <span className="text-red-400">*</span>
                                  </label>
                                  <select
                                    name="paymentDetails.phone_balance.provider"
                                    value={formData.paymentDetails.phone_balance.provider}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                  >
                                    <option value="">Select provider</option>
                                    {phoneProviders.map(provider => (
                                      <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {renderPhoneNumberInput(
                                  'paymentDetails.phone_balance.number',
                                  formData.paymentDetails.phone_balance.number,
                                  'Enter phone number'
                                )}
                              </div>
                            </div>
                          )}

                          {formData.paymentMethods.includes('western_union') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">Western Union Details</h3>
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                  Location <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="paymentDetails.western_union.location"
                                  value={formData.paymentDetails.western_union.location}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                  placeholder="Enter Western Union location"
                                />
                              </div>
                            </div>
                          )}

                          {formData.paymentMethods.includes('moneygram') && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                              <h3 className="text-lg font-medium text-white mb-4">MoneyGram Details</h3>
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                  Location <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="paymentDetails.moneygram.location"
                                  value={formData.paymentDetails.moneygram.location}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50"
                                  placeholder="Enter MoneyGram location"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {step === 4 && (
                        <div className="space-y-6">
                          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-medium text-white mb-4">Review Your Information</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <span className="text-gray-400">Nickname</span>
                                <span className="text-white">{formData.nickname}</span>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <span className="text-gray-400">Payment Methods</span>
                                <div className="flex gap-2">
                                  {formData.paymentMethods.map(method => (
                                    <span key={method} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">
                                      {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {formData.paymentMethods.includes('bank') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Bank Name</span>
                                    <span className="text-white">{formData.paymentDetails.bank.bankName}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">RIB</span>
                                    <span className="text-white">{formData.paymentDetails.bank.accountNumber}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Account Holder</span>
                                    <span className="text-white">{formData.paymentDetails.bank.accountHolder}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('flouci') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Flouci Phone Number</span>
                                    <span className="text-white">{formData.paymentDetails.flouci.number}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('d17') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">D17 Phone Number</span>
                                    <span className="text-white">{formData.paymentDetails.d17.number}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('postepay') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Postepay Account Number</span>
                                    <span className="text-white">{formData.paymentDetails.postepay.accountNumber}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Account Holder</span>
                                    <span className="text-white">{formData.paymentDetails.postepay.accountHolder}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('phone_balance') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Provider</span>
                                    <span className="text-white">
                                      {phoneProviders.find(p => p.id === formData.paymentDetails.phone_balance.provider)?.name || 'Not selected'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Phone Number</span>
                                    <span className="text-white">{formData.paymentDetails.phone_balance.number}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('western_union') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Western Union Location</span>
                                    <span className="text-white">{formData.paymentDetails.western_union.location}</span>
                                  </div>
                                </div>
                              )}
                              {formData.paymentMethods.includes('moneygram') && (
                                <div className="p-4 bg-white/5 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">MoneyGram Location</span>
                                    <span className="text-white">{formData.paymentDetails.moneygram.location}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      if (step === 1) {
                        onClose();
                      } else {
                        setStep(prev => Math.max(1, prev - 1));
                      }
                    }}
                    className={`px-6 py-3 rounded-xl transition-all ${
                      step === 1
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {step === 1 ? 'Cancel' : 'Previous'}
                  </button>
                  {step < steps.length ? (
                    <button
                      onClick={handleNextStep}
                      className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 group ${
                        isStepValid()
                          ? 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
                          : 'bg-white/5 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!isStepValid()}
                    >
                      <span className={isStepValid() ? 'text-blue-400' : 'text-gray-400'}>Next</span>
                      <ArrowRight className={`w-5 h-5 ${isStepValid() ? 'text-blue-400' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-all flex items-center gap-2 group"
                    >
                      <span className="text-green-400">Complete Setup</span>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default P2PProfileSetup; 
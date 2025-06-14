import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Clock, AlertCircle, Wallet } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ActionLoader from '../assets/animations/ActionLoader';
import ComingSoonOverlay from '../components/ui/ComingSoonOverlay';

const BankTransfer = () => {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    accountNumber: '',
    fullName: '',
    bankName: '',
    amount: '',
    description: ''
  });
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAccounts = savedAccounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bank-accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSavedAccounts(response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error(t('bankTransfer.errors.loadAccounts'), {
        toastId: 'bank-accounts-error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // RIB: only digits, max 20
    if (name === 'accountNumber') {
      if (!/^\d{0,20}$/.test(value)) return;
      // Unselect saved account if editing account number
      if (selectedAccount && value !== selectedAccount.accountNumber) {
        setSelectedAccount(null);
      }
    }
    // Full name: only letters and spaces
    if (name === 'fullName') {
      if (!/^[\p{L} .'-]*$/u.test(value)) return;
      // Unselect saved account if editing full name
      if (selectedAccount && value !== selectedAccount.name) {
        setSelectedAccount(null);
      }
    }
    // Bank name: only letters, spaces, and numbers
    if (name === 'bankName') {
      if (!/^[\p{L}\d .'-]*$/u.test(value)) return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        amount: value
      }));
    }
  };

  const handleAmountIncrement = () => {
    setFormData(prev => {
      const currentAmount = parseFloat(prev.amount) || 0;
      const newAmount = (currentAmount + 1).toFixed(2);
      return { ...prev, amount: newAmount };
    });
  };

  const handleAmountDecrement = () => {
    setFormData(prev => {
      const currentAmount = parseFloat(prev.amount) || 0;
      if (currentAmount > 0) {
        const newAmount = (currentAmount - 1).toFixed(2);
        return { ...prev, amount: newAmount };
      }
      return prev;
    });
  };

  const handleSaveAccount = async () => {
    const errors = {};
    if (!formData.accountNumber) errors.accountNumber = true;
    if (!formData.fullName) errors.fullName = true;
    if (!formData.bankName) errors.bankName = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (formData.accountNumber.length !== 20) {
      toast.error(t('bankTransfer.errors.invalidRIB') || 'RIB must be 20 digits');
      return;
    }
    const exists = savedAccounts.some(
      acc => acc.accountNumber === formData.accountNumber
    );
    if (exists) {
      toast.error(t('bankTransfer.accountExists'));
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/bank-accounts', {
        accountNumber: formData.accountNumber,
        name: formData.fullName,
        bankName: formData.bankName
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success(t('bankTransfer.accountSaved'));
      fetchBankAccounts();
    } catch (error) {
      toast.error(t('bankTransfer.errors.failed') || 'Failed to save account');
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setFormData(prev => ({
      ...prev,
      accountNumber: account.accountNumber,
      fullName: account.name,
      bankName: account.bankName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      toast.error(t('bankTransfer.errors.selectAccount'));
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t('bankTransfer.errors.invalidAmount'));
      return;
    }

    try {
      // Here you would make the actual transfer API call
      // await axios.post('/api/transfers', {
      //   accountId: selectedAccount._id,
      //   amount: parseFloat(formData.amount),
      //   description: formData.description
      // });
      
      toast.success(t('bankTransfer.success'));
      setFormData({ accountNumber: '', fullName: '', bankName: '', amount: '', description: '' });
      setSelectedAccount(null);
    } catch (error) {
      toast.error(t('bankTransfer.errors.failed'));
    }
  };

  if (isLoading) {
    return <ActionLoader isLoading={true} />;
  }

  return (
    <>
      <ComingSoonOverlay 
        title="Bank Transfer"
        description="Transfer money to any bank account in Tunisia"
        onClose={() => navigate('/dashboard')}
      />
      <div className="space-y-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('bankTransfer.title')}</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                : 'bg-white border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
            } border rounded-xl p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('bankTransfer.formTitle')}</h2>
              <div className="text-right">
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('bankTransfer.availableBalance')}</div>
                <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {userProfile?.walletBalance?.toFixed(2) || '0.00'} TND
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('bankTransfer.accountNumber')}</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="\d{20}"
                  maxLength={20}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.accountNumber ? 'border-red-500' : isDark
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
                  placeholder={t('bankTransfer.accountNumberPlaceholder')}
                />
                {fieldErrors.accountNumber && (
                  <div className="text-xs text-red-500 mt-1">{t('bankTransfer.errors.required') || 'Required'}</div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('bankTransfer.fullName')}</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  pattern="[A-Za-z .'-]+"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.fullName ? 'border-red-500' : isDark
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
                  placeholder={t('bankTransfer.fullNamePlaceholder')}
                />
                {fieldErrors.fullName && (
                  <div className="text-xs text-red-500 mt-1">{t('bankTransfer.errors.required') || 'Required'}</div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('bankTransfer.bankName')}</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  pattern="[A-Za-z .'-]+"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    fieldErrors.bankName ? 'border-red-500' : isDark
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
                  placeholder={t('bankTransfer.bankNamePlaceholder')}
                />
                {fieldErrors.bankName && (
                  <div className="text-xs text-red-500 mt-1">{t('bankTransfer.errors.required') || 'Required'}</div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('bankTransfer.amount')}</label>
                <div className="relative">
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                        : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
                    placeholder={t('bankTransfer.amountPlaceholder')}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAmountDecrement}
                      className={`w-6 h-6 flex items-center justify-center rounded-full ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      } transition-colors duration-300`}
                      disabled={!formData.amount || parseFloat(formData.amount) <= 0}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={handleAmountIncrement}
                      className={`w-6 h-6 flex items-center justify-center rounded-full ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      } transition-colors duration-300`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('bankTransfer.description')}</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200`}
                  placeholder={t('bankTransfer.descriptionPlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  onClick={handleSaveAccount}
                >
                  {t('bankTransfer.saveAccount')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {t('bankTransfer.submit')}
                </button>
              </div>
            </form>
          </motion.div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                  : 'bg-white border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
              } border rounded-xl p-6 h-[420px] flex flex-col`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('bankTransfer.savedAccounts')}</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('bankTransfer.searchPlaceholder') || 'Search by name...'}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-blue-500 focus:bg-gray-800'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:bg-white'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 mb-4`}
              />
              <div className={"space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-3"}>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
                      isDark ? 'border-blue-400 border-t-transparent' : 'border-blue-600 border-t-transparent'
                    }`}></div>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('bankTransfer.noSavedAccounts')}</div>
                ) : (
                  filteredAccounts.map((account) => (
                    <button
                      key={account._id}
                      onClick={() => handleAccountSelect(account)}
                      className={`w-full p-4 rounded-lg transition-all duration-200 flex items-center gap-3 group border 
                        ${isDark
                          ? selectedAccount?._id === account._id
                            ? 'bg-blue-900/40 border-blue-500'
                            : 'bg-gray-800/50 hover:bg-gray-700 border border-gray-700'
                          : selectedAccount?._id === account._id
                            ? 'bg-blue-100 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      <Building2 className={`${isDark ? 'text-blue-400' : 'text-blue-600'} w-5 h-5`} />
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{account.name}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{account.bankName}</div>
                        <div className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{account.accountNumber}</div>
                      </div>
                      <ArrowRight className={`${isDark ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} w-5 h-5`} />
                    </button>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                  : 'bg-white border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
              } border rounded-xl p-6`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('bankTransfer.importantInfo')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('bankTransfer.infoBankHours')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('bankTransfer.infoFees')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BankTransfer; 
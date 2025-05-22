import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell,
  Lock,
  Shield,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  Database,
  Globe,
  Wallet,
  Building2,
  Bitcoin
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';

const Settings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const { t } = useTranslation();

  // Transfer limits state
  const [limits, setLimits] = useState({
    transferLimits: {
      daily: '',
      weekly: '',
      monthly: '',
      perTransaction: ''
    },
    bankTransferLimits: {
      daily: '',
      weekly: '',
      monthly: '',
      perTransaction: ''
    }
  });
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [limitsError, setLimitsError] = useState('');

  // Fetch limits on mount
  useEffect(() => {
    async function fetchLimits() {
      try {
        const res = await api.get('/api/settings/transfer-limits');
        setLimits(res.data);
      } catch (err) {
        setLimitsError('Failed to load limits');
      } finally {
        setLimitsLoading(false);
      }
    }
    fetchLimits();
  }, []);

  const handleLimitChange = (e) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const [category, field] = name.split('.');
    setLimits(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setShowSuccessAlert(false);
    setShowErrorAlert(false);
    setLimitsError('');
    try {
      await api.put('/api/settings/transfer-limits', {
        transferLimits: {
          daily: Number(limits.transferLimits.daily),
          weekly: Number(limits.transferLimits.weekly),
          monthly: Number(limits.transferLimits.monthly),
          perTransaction: Number(limits.transferLimits.perTransaction)
        },
        bankTransferLimits: {
          daily: Number(limits.bankTransferLimits.daily),
          weekly: Number(limits.bankTransferLimits.weekly),
          monthly: Number(limits.bankTransferLimits.monthly),
          perTransaction: Number(limits.bankTransferLimits.perTransaction)
        }
      });
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (err) {
      setShowErrorAlert(true);
      setLimitsError('Failed to save limits');
      setTimeout(() => setShowErrorAlert(false), 3000);
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.settings')}</h1>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showSuccessAlert ? 1 : 0, y: showSuccessAlert ? 0 : -20 }}
          className={`${
            isDark
              ? 'bg-green-900/20'
              : 'bg-green-50'
          } p-4 rounded-lg flex items-start gap-3 ${showSuccessAlert ? '' : 'hidden'}`}
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-800 dark:text-green-200 font-medium">{t('admin.settings_saved_successfully')}</p>
            <p className="text-green-600 dark:text-green-300 text-sm mt-1">
              {t('admin.changes_have_been_saved_and_will_take_effect_immediately')}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showErrorAlert ? 1 : 0, y: showErrorAlert ? 0 : -20 }}
          className={`${
            isDark
              ? 'bg-red-900/20'
              : 'bg-red-50'
          } p-4 rounded-lg flex items-start gap-3 ${showErrorAlert ? '' : 'hidden'}`}
        >
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-800 dark:text-red-200 font-medium">{t('admin.error_saving_settings')}</p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {t('admin.there_was_a_problem_saving_your_changes_please_try_again')}
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">{t('admin.security')}</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.two_factor_authentication')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.require_2fa_for_all_admin_actions')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.session_timeout')}</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.automatically_log_out_after_inactivity')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.ip_whitelist')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.restrict_admin_access_to_specific_ip_addresses')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">{t('admin.notifications')}</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.kyc_requests')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.notify_when_new_kyc_verification_requests_are_submitted')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.support_tickets')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.notify_when_new_support_tickets_are_created')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.large_transactions')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.notify_for_transactions_over_10_000_tnd')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">{t('admin.system')}</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.maintenance_mode')}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.enable_maintenance_mode_for_system_updates')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.error_logging')}</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.set_the_minimum_log_level_for_system_events')}
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between">
                  <span className="font-medium">{t('admin.backup_schedule')}</span>
                  <select className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('admin.set_the_frequency_of_system_backups')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Transaction Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${
              isDark 
                ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                : 'bg-white border-gray-200'
            } border rounded-xl p-6`}
          >
            <h2 className="text-xl font-semibold mb-6">{t('admin.transactions')}</h2>
            <div className="space-y-6">
              {/* User Transfer Limits */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('admin.user_transfer_limits')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.daily_limit_tnd')}</label>
                    <input
                      type="number"
                      name="transferLimits.daily"
                      value={limits.transferLimits?.daily || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.weekly_limit_tnd')}</label>
                    <input
                      type="number"
                      name="transferLimits.weekly"
                      value={limits.transferLimits?.weekly || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.monthly_limit_tnd')}</label>
                    <input
                      type="number"
                      name="transferLimits.monthly"
                      value={limits.transferLimits?.monthly || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.per_transaction')}</label>
                    <input
                      type="number"
                      name="transferLimits.perTransaction"
                      value={limits.transferLimits?.perTransaction || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfer Limits */}
              <div>
                <h3 className="text-lg font-medium mb-4">{t('admin.bank_transfer_limits')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.daily_limit_tnd')}</label>
                    <input
                      type="number"
                      name="bankTransferLimits.daily"
                      value={limits.bankTransferLimits?.daily || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.weekly_limit_tnd')}</label>
                    <input
                      type="number"
                      name="bankTransferLimits.weekly"
                      value={limits.bankTransferLimits?.weekly || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.monthly_limit_tnd')}</label>
                    <input
                      type="number"
                      name="bankTransferLimits.monthly"
                      value={limits.bankTransferLimits?.monthly || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400">{t('admin.per_transaction')}</label>
                    <input
                      type="number"
                      name="bankTransferLimits.perTransaction"
                      value={limits.bankTransferLimits?.perTransaction || ''}
                      onChange={handleLimitChange}
                      className={`w-full px-4 py-2 mt-1 rounded-lg border ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('admin.save_changes')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${
            isDark 
              ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
              : 'bg-white border-gray-200'
          } border rounded-xl p-6`}
        >
          <h2 className="text-xl font-semibold mb-6">{t('admin.quick_actions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Database className="w-5 h-5 text-blue-400" />
              {t('admin.backup_database')}
            </button>
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Key className="w-5 h-5 text-blue-400" />
              {t('admin.rotate_api_keys')}
            </button>
            <button className={`p-4 rounded-lg ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors flex items-center gap-3`}
            >
              <Shield className="w-5 h-5 text-blue-400" />
              {t('admin.security_audit')}
            </button>
          </div>
        </motion.div>
      </div>
  );
};

export default Settings;
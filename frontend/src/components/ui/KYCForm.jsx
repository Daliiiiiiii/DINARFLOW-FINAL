import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Camera, FileText, AlertTriangle, ChevronDown, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const TUNISIA_PROVINCES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine',
  'Tozeur', 'Tunis', 'Zaghouan'
];

const KYCForm = ({ onClose, onSubmit }) => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    idType: '',
    idNumber: '',
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    idDocument: null,
    selfie: null,
    proofOfAddress: null
  });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState('');

  // Calculate max date (18 years ago from today)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Add this effect to update names when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || userProfile.firstName || '',
        lastName: prev.lastName || userProfile.lastName || ''
      }));
    }
  }, [userProfile]);

  const handleFileChange = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleFileDelete = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      return (
        formData.firstName &&
        formData.lastName &&
        formData.dateOfBirth &&
        formData.address &&
        formData.city &&
        formData.province &&
        formData.zipCode
      );
    }
    if (step === 2) {
      return (
        formData.idType &&
        formData.idNumber && formData.idNumber.length === 8 &&
        formData.selfieWithId
      );
    }
    if (step === 3) {
      return (
        formData.frontId &&
        formData.backId
      );
    }
    return true;
  };

  const markAllTouched = () => {
    if (step === 1) {
      setTouched(t => ({ 
        ...t, 
        firstName: true, 
        lastName: true, 
        dateOfBirth: true, 
        address: true, 
        city: true,
        province: true,
        zipCode: true 
      }));
    } else if (step === 2) {
      setTouched(t => ({ ...t, idType: true, idNumber: true, selfieWithId: true }));
    } else if (step === 3) {
      setTouched(t => ({ ...t, frontId: true, backId: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    markAllTouched();
    // Custom file validation
    if (step === 1 && (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.address || !formData.city || !formData.province || !formData.zipCode)) {
      return;
    }
    if (step === 2 && (!formData.idType || !formData.idNumber || formData.idNumber.length !== 8 || !formData.selfieWithId)) {
      return;
    }
    if (step === 3 && (!formData.frontId || !formData.backId)) {
      setError('Please upload all required documents.');
      return;
    }
    setError('');
    if (validateStep()) {
      try {
        await onSubmit(formData);
        setIsSubmitted(true);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleNext = () => {
    markAllTouched();
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const FileUploadField = ({ id, label, icon: Icon, accept, value, onChange, onDelete, error }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
        onClick={() => document.getElementById(id).click()}
      >
        <input
          type="file"
          id={id}
          className="hidden"
          accept={accept}
          onChange={(e) => onChange(e.target.files[0])}
        />
        {!value ? (
          <>
            <Icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">
              {t('kycForm.clickToUpload')} {label.toLowerCase()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 5MB
            </p>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-300 truncate max-w-[200px]">
                {value.name}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );

  return (
    <div className="bg-gray-950/90 z-[100] flex items-center justify-center p-4 w-full h-full absolute top-0 left-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-blue-500/10 via-purple-500/10 to-transparent blur-3xl" />
        </div>

        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('kycForm.submissionSuccessful')}
              </h3>
              <p className="text-gray-400 mb-6">
                {t('kycForm.verificationInProgress')}
              </p>
              <div className="bg-blue-500/10 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-blue-300">
                    {t('kycForm.verificationTime')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('kycForm.close')}
              </button>
            </motion.div>
          ) : (
            <>
          {/* Title */}
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            {t('kycForm.kycVerification')}
          </h2>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">{t('kycForm.step')} {step} {t('kycForm.of')} 3</span>
              <span className="text-sm text-gray-400">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="bg-blue-600 h-2 rounded-full"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('kycForm.firstName')}
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        setFormData({ ...formData, firstName: val });
                      }}
                      className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.firstName && !formData.firstName ? 'border-red-500' : 'border-gray-700'}`}
                      required
                    />
                    {touched.firstName && !formData.firstName && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('kycForm.lastName')}
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        setFormData({ ...formData, lastName: val });
                      }}
                      className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.lastName && !formData.lastName ? 'border-red-500' : 'border-gray-700'}`}
                      required
                    />
                    {touched.lastName && !formData.lastName && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('kycForm.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={maxDateString}
                    className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.dateOfBirth && !formData.dateOfBirth ? 'border-red-500' : 'border-gray-700'}`}
                    required
                  />
                  {touched.dateOfBirth && !formData.dateOfBirth && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('kycForm.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.address && !formData.address ? 'border-red-500' : 'border-gray-700'}`}
                    required
                  />
                  {touched.address && !formData.address && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('kycForm.city')}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        setFormData({ ...formData, city: val });
                      }}
                      className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.city && !formData.city ? 'border-red-500' : 'border-gray-700'}`}
                      required
                    />
                    {touched.city && !formData.city && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('kycForm.province')}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${touched.province && !formData.province ? 'border-red-500' : 'border-gray-700'}`}
                        required
                      >
                        <option value="">{t('kycForm.selectProvince')}</option>
                        {TUNISIA_PROVINCES.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                    {touched.province && !formData.province && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('kycForm.zipCode')}
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData({ ...formData, zipCode: val });
                    }}
                    className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.zipCode && formData.zipCode.length !== 4 ? 'border-red-500' : 'border-gray-700'}`}
                    required
                    pattern="\d{4}"
                    maxLength={4}
                    inputMode="numeric"
                  />
                  {touched.zipCode && formData.zipCode.length !== 4 && <span className="text-xs text-red-400">{t('kycForm.4Digits')}</span>}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('kycForm.idType')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${touched.idType && !formData.idType ? 'border-red-500' : 'border-gray-700'}`}
                      required
                    >
                      <option value="">{t('kycForm.selectIDType')}</option>
                      <option value="national_id">{t('kycForm.nationalID')}</option>
                      <option value="passport">{t('kycForm.passport')}</option>
                      <option value="driving_license">{t('kycForm.drivingLicense')}</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                  {touched.idType && !formData.idType && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('kycForm.idNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, idNumber: val });
                    }}
                    className={`w-full px-4 py-2 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.idNumber && formData.idNumber.length !== 8 ? 'border-red-500' : 'border-gray-700'}`}
                    required
                    minLength={8}
                    maxLength={8}
                    pattern="\\d{8}"
                    inputMode="numeric"
                  />
                  {touched.idNumber && formData.idNumber.length !== 8 && <span className="text-xs text-red-400">{t('kycForm.mustBeExactly8Digits')}</span>}
                  {!touched.idNumber && <span className="text-xs text-gray-400">{t('kycForm.exactly8Digits')}</span>}
                </div>

                <FileUploadField
                  id="selfieWithId"
                  label={t('kycForm.selfieWithID')}
                  icon={Camera}
                  accept=".jpg,.jpeg,.png"
                  value={formData.selfieWithId}
                  onChange={(file) => handleFileChange('selfieWithId', file)}
                  onDelete={() => handleFileDelete('selfieWithId')}
                  error={touched.selfieWithId && !formData.selfieWithId ? t('kycForm.required') : null}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <FileUploadField
                  id="frontId"
                  label={t('kycForm.frontSideOfID')}
                  icon={FileText}
                  accept=".jpg,.jpeg,.png"
                  value={formData.frontId}
                  onChange={(file) => handleFileChange('frontId', file)}
                  onDelete={() => handleFileDelete('frontId')}
                  error={touched.frontId && !formData.frontId ? t('kycForm.required') : null}
                />

                <FileUploadField
                  id="backId"
                  label={t('kycForm.backSideOfID')}
                  icon={Upload}
                  accept=".jpg,.jpeg,.png"
                  value={formData.backId}
                  onChange={(file) => handleFileChange('backId', file)}
                  onDelete={() => handleFileDelete('backId')}
                  error={touched.backId && !formData.backId ? t('kycForm.required') : null}
                />

                <div className="bg-yellow-900/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium">{t('kycForm.important')}</p>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      {t('kycForm.pleaseEnsureAllDocumentsAreClearAndValid')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('kycForm.back')}
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ml-auto"
                >
                  {t('kycForm.next')}
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ml-auto"
                >
                  {t('kycForm.submit')}
                </button>
              )}
            </div>
          </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default KYCForm;
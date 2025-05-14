import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Camera, FileText, AlertTriangle, ChevronDown, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import api from '../../lib/axios';

const TUNISIA_PROVINCES_EN = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine',
  'Tozeur', 'Tunis', 'Zaghouan'
];

const TUNISIA_PROVINCES_AR = [
  'أريانة', 'باجة', 'بن عروس', 'بنزرت', 'قابس', 'قفصة', 'جندوبة',
  'القيروان', 'القصرين', 'قبلي', 'الكاف', 'المهدية', 'منوبة', 'مدنين',
  'المنستير', 'نابل', 'صفاقس', 'سيدي بوزيد', 'سليانة', 'سوسة', 'تطاوين',
  'توزر', 'تونس', 'زغوان'
];

const getProvinces = (lang) => {
  if (lang === 'ar') return TUNISIA_PROVINCES_AR;
  return TUNISIA_PROVINCES_EN;
};

const KYCForm = ({ onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const initialFormState = {
    idType: '',
    idNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    frontId: null,
    backId: null,
    selfieWithId: null,
    signature: null
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  const [countdown, setCountdown] = useState(5);

  // Calculate max date (18 years ago from today)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Update form data when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || ''
      }));
    }
  }, [userProfile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setFormData(initialFormState);
      setTouched({});
      setError('');
      setUploadProgress({});
      setFilePreviews({});
    };
  }, []);

  const validateStep = () => {
    const errors = {};
    
    if (currentStep === 1) {
      if (!formData.firstName?.trim()) errors.firstName = t('kycForm.errors.firstNameRequired');
      if (!formData.lastName?.trim()) errors.lastName = t('kycForm.errors.lastNameRequired');
      if (!formData.dateOfBirth) errors.dateOfBirth = t('kycForm.errors.dateOfBirthRequired');
      if (!formData.address?.trim()) errors.address = t('kycForm.errors.addressRequired');
      if (!formData.city?.trim()) errors.city = t('kycForm.errors.cityRequired');
      if (!formData.province?.trim()) errors.province = t('kycForm.errors.provinceRequired');
      if (!formData.zipCode?.match(/^\d{4}$/)) errors.zipCode = t('kycForm.errors.zipCodeInvalid');
    } else if (currentStep === 2) {
      if (!formData.idType) errors.idType = t('kycForm.errors.idTypeRequired');
      if (!formData.idNumber?.match(/^\d{8}$/)) errors.idNumber = t('kycForm.errors.idNumberInvalid');
    } else if (currentStep === 3) {
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      
      if (!formData.frontId) errors.frontId = t('kycForm.errors.frontIdRequired');
      else if (formData.frontId.size > maxFileSize) errors.frontId = t('kycForm.errors.fileTooLarge');
      else if (!allowedTypes.includes(formData.frontId.type)) errors.frontId = t('kycForm.errors.invalidFileType');
      
      if (!formData.backId) errors.backId = t('kycForm.errors.backIdRequired');
      else if (formData.backId.size > maxFileSize) errors.backId = t('kycForm.errors.fileTooLarge');
      else if (!allowedTypes.includes(formData.backId.type)) errors.backId = t('kycForm.errors.invalidFileType');
      
      if (!formData.selfieWithId) errors.selfieWithId = t('kycForm.errors.selfieRequired');
      else if (formData.selfieWithId.size > maxFileSize) errors.selfieWithId = t('kycForm.errors.fileTooLarge');
      else if (!allowedTypes.includes(formData.selfieWithId.type)) errors.selfieWithId = t('kycForm.errors.invalidFileType');
      
      if (!formData.signature) errors.signature = t('kycForm.errors.signatureRequired');
      else if (formData.signature.size > maxFileSize) errors.signature = t('kycForm.errors.fileTooLarge');
      else if (!allowedTypes.includes(formData.signature.type)) errors.signature = t('kycForm.errors.invalidFileType');
    }
    
    setError(Object.values(errors).join('\n') || '');
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (field, file) => {
    if (!file) {
      setFormData(prev => ({ ...prev, [field]: null }));
      return;
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (file.size > maxFileSize) {
      toast.error(t('kycForm.errors.fileTooLarge'));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(t('kycForm.errors.invalidFileType'));
      return;
    }

    // Create a preview URL for the image
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [field]: file }));
    setFilePreviews(prev => ({ ...prev, [field]: previewUrl }));
  };

  const handleFileDelete = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
    if (filePreviews[field]) {
      URL.revokeObjectURL(filePreviews[field]);
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[field];
        return newPreviews;
      });
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const markAllTouched = useCallback(() => {
    if (currentStep === 1) {
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
    } else if (currentStep === 2) {
      setTouched(t => ({ ...t, idType: true, idNumber: true, selfieWithId: true }));
    } else if (currentStep === 3) {
      setTouched(t => ({ ...t, frontId: true, backId: true, signature: true }));
    }
  }, [currentStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!validateStep()) {
      toast.error(t('kycForm.errors.pleaseCompleteAllFields'));
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      // Add personal information
      formDataToSend.append('idType', formData.idType);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('province', formData.province);
      formDataToSend.append('zipCode', formData.zipCode);

      // Add files with proper error handling
      const fileFields = ['frontId', 'backId', 'selfieWithId', 'signature'];
      for (const field of fileFields) {
        if (formData[field]) {
          try {
            formDataToSend.append(field, formData[field]);
          } catch (error) {
            console.error(`Error appending ${field}:`, error);
            toast.error(t('kycForm.errors.fileUploadError'));
            setIsSubmitting(false);
            return;
          }
        }
      }

      const response = await api.post('/api/kyc/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            total: percentCompleted
          }));
        },
        timeout: 60000 // 60 second timeout for large file uploads
      });

      // Check if response has data
      if (response.data) {
        setIsSubmitted(true);
        toast.success(t('kycForm.submissionSuccessful'));
        setTimeout(() => {
          window.location.reload();
        }, 5000);
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Close form after 3 seconds
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 3000);
      } else {
        throw new Error('KYC submission failed');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      let errorMessage = t('kycForm.errors.submissionFailed');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = t('kycForm.errors.networkError');
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploadProgress({});
    }
  };

  const handleNext = () => {
    markAllTouched();
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    } else {
      setError(t('kycForm.errors.pleaseCompleteAllFields'));
    }
  };

  const FileUploadField = ({ id, label, icon: Icon, accept, value, onChange, onDelete, error }) => (
    <div>
      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
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
          accept=".jpg,.jpeg,.png"
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
              <span className={`text-sm truncate max-w-[200px] ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prevCountdown => {
        if (prevCountdown > 1) {
          return prevCountdown - 1;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`${isDark ? 'bg-gray-950/90' : 'bg-white/90'} z-[100] flex items-center justify-center p-4 w-full h-full fixed top-0 left-0`} style={{ left: 0, right: 0, width: '100vw', position: 'fixed' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-2xl w-full ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-8 relative overflow-hidden`}
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
            className={`absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <X className="w-6 h-6" />
          </button>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center py-8 ${isDark ? 'text-white' : 'text-gray-900'}`}
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
              <div className={`${isDark ? 'bg-blue-500/10' : 'bg-blue-100'} rounded-lg p-4 mb-6`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-blue-300">
                    {t('kycForm.verificationTime')}
                  </p>
                </div>
              </div>
              <p className="text-blue-400 font-medium mb-4">
                {t('kycForm.redirectingIn', { seconds: countdown })}
              </p>
            </motion.div>
          ) : (
            <>
          {/* Title */}
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent' : 'text-gray-900'}`}>
            {t('kycForm.kycVerification')}
          </h2>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">{t('kycForm.step')} {currentStep} {t('kycForm.of')} 3</span>
              <span className="text-sm text-gray-400">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-2`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 3) * 100}%` }}
                className={`${isDark ? 'bg-blue-600' : 'bg-blue-500'} h-2 rounded-full`}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {t('kycForm.firstName')}
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        handleInputChange('firstName', val);
                      }}
                      className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.firstName && !formData.firstName ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                      required
                    />
                    {touched.firstName && !formData.firstName && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {t('kycForm.lastName')}
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        handleInputChange('lastName', val);
                      }}
                      className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.lastName && !formData.lastName ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                      required
                    />
                    {touched.lastName && !formData.lastName && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('kycForm.dateOfBirth')}
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    max={maxDateString}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.dateOfBirth && !formData.dateOfBirth ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                    required
                  />
                  {touched.dateOfBirth && !formData.dateOfBirth && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('kycForm.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.address && !formData.address ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                    required
                  />
                  {touched.address && !formData.address && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {t('kycForm.city')}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, '');
                        handleInputChange('city', val);
                      }}
                      className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.city && !formData.city ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                      required
                    />
                    {touched.city && !formData.city && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {t('kycForm.province')}
                    </label>
                    <div className="relative">
                      <select
                        value={formData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${touched.province && !formData.province ? 'border-red-500' : ''}`}
                        required
                      >
                        <option value="">{t('kycForm.selectProvince')}</option>
                        {getProvinces(i18n.language).map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                    {touched.province && !formData.province && <span className="text-xs text-red-400">{t('kycForm.required')}</span>}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('kycForm.zipCode')}
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      handleInputChange('zipCode', val);
                    }}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.zipCode && formData.zipCode.length !== 4 ? 'border-red-500' : isDark ? 'border-gray-700' : 'border-gray-300'}`}
                    required
                    pattern="\d{4}"
                    maxLength={4}
                    inputMode="numeric"
                  />
                  {touched.zipCode && formData.zipCode.length !== 4 && <span className="text-xs text-red-400">{t('kycForm.4Digits')}</span>}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('kycForm.idType')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.idType}
                      onChange={(e) => handleInputChange('idType', e.target.value)}
                      className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${touched.idType && !formData.idType ? 'border-red-500' : ''}`}
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
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {t('kycForm.idNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      handleInputChange('idNumber', val);
                    }}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${touched.idNumber && formData.idNumber.length !== 8 ? 'border-red-500' : ''}`}
                    required
                    minLength={8}
                    maxLength={8}
                    pattern="\d{8}"
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

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
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

                <FileUploadField
                  id="signature"
                  label={t('kycForm.signature')}
                  icon={FileText}
                  accept=".jpg,.jpeg,.png"
                  value={formData.signature}
                  onChange={(file) => handleFileChange('signature', file)}
                  onDelete={() => handleFileDelete('signature')}
                  error={touched.signature && !formData.signature ? t('kycForm.required') : null}
                />

                <div className="bg-yellow-900/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <div>
                    <p className={`text-sm font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{t('kycForm.important')}</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('kycForm.pleaseEnsureAllDocumentsAreClearAndValid')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className={`px-6 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  {t('kycForm.back')}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`ml-auto px-6 py-2 rounded-lg ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                {isSubmitting ? t('common.loading') : currentStep === 3 ? t('kycForm.submit') : t('kycForm.next')}
              </button>
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
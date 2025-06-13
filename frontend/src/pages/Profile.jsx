import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext' // Fixed import path
import { toast } from 'react-toastify'
import { 
  RiUser3Line, 
  RiPhoneLine, 
  RiShieldUserLine, 
  RiEditLine, 
  RiImageAddLine,
  RiMapPinLine,
  RiLockLine,
  RiBankCardLine,
  RiFileCopyLine
} from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import ActionLoader from '../assets/animations/ActionLoader'
import KYCOverlay from '../layouts/KYCOverlay'
import KYCForm from '../components/ui/KYCForm'
import ReactDOM from 'react-dom'
import api from '../lib/axios'
import { getImageUrl } from '../utils/urlUtils'
import { CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { currentUser, updateUserProfile, startKycVerification } = useAuth() // Get user and update function from context
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [profileImage, setProfileImage] = useState(currentUser?.profilePicture || null)
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showKycOverlay, setShowKycOverlay] = useState(false)
  const [showKycForm, setShowKycForm] = useState(false)
  const [bankAccount, setBankAccount] = useState(null)
  const [bankAccountLoading, setBankAccountLoading] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  // Create a ref for the hidden file input
  const fileInputRef = useRef(null)

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error(t('profile.errors.invalidImageType'));
        return;
      }

      if (file.size > maxSize) {
        toast.error(t('profile.errors.imageTooLarge'));
        return;
      }

      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('profilePicture', file)
        
        const response = await api.post('/api/users/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data?.user) {
          // Update the user profile with the new data
          await updateUserProfile(response.data.user);
          setProfileImage(response.data.user.profilePicture);
          toast.success(t('profile.success.imageUpdated'));
        }
      } catch (error) {
        console.error('Error uploading profile image:', error)
        toast.error(error.response?.data?.error || t('profile.errors.uploadFailed'))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePhoneUpdate = async () => {
    try {
      await updateUserProfile({ phoneNumber })
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Error updating phone number:', error)
    }
  }

  const handleRemovePhoto = async () => {
    if (!profileImage) return;
    
    setIsLoading(true);
    try {
      await updateUserProfile({ profileImage: null });
      setProfileImage(null);
      toast.success(t('profile.success.imageRemoved'));
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error(error.response?.data?.message || t('profile.errors.removeFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  // Function to trigger file input click
  const handleAreaClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  const handleKycSubmit = async (formData) => {
    try {
      await startKycVerification(formData);
    } catch (error) {
      // Remove duplicate toast since it's handled in KYCForm
    }
  };

  const handleCopyRIB = async () => {
    if (bankAccount?.accountNumber) {
      await navigator.clipboard.writeText(bankAccount.accountNumber);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  // Update local state when user data changes
  useEffect(() => {
    if (currentUser) {
      setProfileImage(currentUser.profilePicture || null)
      setPhoneNumber(currentUser.phoneNumber || '')
    }
  }, [currentUser])

  useEffect(() => {
    const fetchBankAccount = async () => {
      console.log('Current user:', currentUser); // Log current user
      if (currentUser?.associatedBankAccount) {
        const bankAccountId = typeof currentUser.associatedBankAccount === 'object' 
          ? currentUser.associatedBankAccount._id 
          : currentUser.associatedBankAccount;
        console.log('Fetching bank account with ID:', bankAccountId); // Log bank account ID
        setBankAccountLoading(true);
        try {
          const token = localStorage.getItem('token');
          const { data } = await api.get(`/api/bank-accounts/${bankAccountId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Bank account response:', data); // Log full response
          if (data.bankAccount) {
            setBankAccount(data.bankAccount);
          } else {
            console.error('No bank account data in response:', data);
            setBankAccount(null);
          }
        } catch (e) {
          console.error('Error fetching bank account:', {
            error: e,
            response: e.response?.data,
            status: e.response?.status,
            bankAccountId
          });
          setBankAccount(null);
        } finally {
          setBankAccountLoading(false);
        }
      } else {
        console.log('No associated bank account found for user'); // Log when no bank account is associated
      }
    };
    fetchBankAccount();
  }, [currentUser]);

  console.log('KYC object:', currentUser.kyc);

  if (isLoading) {
    return <ActionLoader isLoading={true} />;
  }

  if (!currentUser) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6 pb-8"
    >
      {/* Header Section */}
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-4">
          <RiUser3Line className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Image */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.photo')}</h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30">
              <div 
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Main clickable area */}
                <div 
                  onClick={handleAreaClick}
                  className="w-40 h-40 rounded-full overflow-hidden bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                >
                  {profileImage ? (
                    <>
                      <img
                        src={getImageUrl(profileImage)}
                        alt={`${currentUser.displayName}'s profile`}
                        className="w-full h-full object-cover transition-all duration-300"
                        onError={(e) => {
                          console.error('Profile image failed to load:', profileImage);
                          e.target.src = ''; // Clear the src to prevent infinite error loop
                          setProfileImage(null); // Reset to default avatar
                        }}
                      />
                      <div className={`absolute inset-0 bg-black transition-opacity duration-300 flex flex-col items-center justify-center ${isHovered ? 'bg-opacity-50' : 'bg-opacity-0'}`}>
                        <span className={`text-white font-medium transform transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                          {t('profile.changePhoto')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                      <span className="text-2xl font-semibold">
                        {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-10 h-10 border-4 border-white dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="profile-image"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
                
                {/* Upload Button */}
                <label
                  htmlFor="profile-image"
                  className={`absolute bottom-2 right-2 w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transform transition-all duration-300 
                    ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                    hover:bg-primary-700 dark:hover:bg-primary-600 hover:scale-110 hover:shadow-xl z-10`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <RiImageAddLine className="text-white" size={24} />
                </label>
              </div>

              {/* Remove Photo Button */}
              {profileImage && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleRemovePhoto}
                  className="mt-6 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RiImageAddLine className="rotate-45" size={16} />
                  <span>{t('profile.removePhoto')}</span>
                </motion.button>
              )}

              {/* Helper Text */}
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {t('profile.photoHelper')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Personal Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Name Section */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiUser3Line className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.displayName', { defaultValue: t('profile.fullName') })}</h2>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RiLockLine className="mr-1" size={16} />
                  {t('profile.readOnly')}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <span className="text-gray-900 dark:text-gray-100 font-medium flex items-center">
                  {currentUser.displayName}
                  {currentUser.kyc?.status === 'verified' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Phone Number Section */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiPhoneLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.phoneNumber')}</h2>
                </div>
                <button
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-all duration-200"
                >
                  <RiEditLine className="mr-1" size={16} />
                  {isEditingPhone ? t('profile.cancel') : t('profile.edit')}
                </button>
              </div>
            </div>
            <div className="p-6">
              {isEditingPhone ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      placeholder={t('profile.enterPhone')}
                    />
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {t('profile.phoneHelper')}
                    </div>
                  </div>
                  <button
                    onClick={handlePhoneUpdate}
                    className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                  >
                    {t('profile.updatePhone')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{phoneNumber}</span>
                  <span className="px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-full">
                    {t('profile.current')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiMapPinLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.address')}</h2>
                </div>
                {currentUser.kyc?.status === 'verified' && (
                  <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                    <RiShieldUserLine className="mr-1" size={16} />
                    {t('profile.verified')}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {currentUser.kyc?.status === 'verified' ? (
                (() => {
                  // Try to get address from latest submission
                  const submissions = currentUser.kyc.submissions;
                  let address, city, province, zipCode;
                  if (submissions && submissions.length > 0) {
                    const latest = submissions[submissions.length - 1].personalInfo || {};
                    address = latest.address;
                    city = latest.city;
                    province = latest.province;
                    zipCode = latest.zipCode;
                  } else if (currentUser.kyc.address) {
                    // Fallback: address directly on kyc object
                    address = currentUser.kyc.address;
                  }
                  return address ? (
                    <div className="space-y-2">
                      <div className="text-gray-900 dark:text-gray-100 font-medium">{address}</div>
                      {(city || province || zipCode) && (
                        <div className="text-gray-600 dark:text-gray-300">
                          {[city, province, zipCode].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">
                      {t('profile.noAddressAvailable')}
                    </div>
                  );
                })()
              ) : currentUser.kyc?.status === 'pending' ? (
                <div className="flex items-center text-yellow-500 dark:text-yellow-400">
                  <span>{t('profile.kycPending')}</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <span>{t('profile.completeKyc')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Account Section */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiBankCardLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.bankAccount')}</h2>
                </div>
                {currentUser.kyc?.status === 'verified' && (
                  <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                    <RiShieldUserLine className="mr-1" size={16} />
                    {t('profile.verified')}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {bankAccountLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin border-blue-500 border-t-transparent"></div>
                </div>
              ) : bankAccount ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('profile.bankName')}</div>
                      <div className="font-medium">{bankAccount.bankName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('profile.accountHolder')}</div>
                      <div className="font-medium">{bankAccount.name}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('profile.rib')}</div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg flex-1">
                        {bankAccount.accountNumber}
                      </div>
                      <button
                        onClick={handleCopyRIB}
                        className={`p-2 rounded-lg transition-colors ${
                          showCopied ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                        title={t('profile.copyRIB')}
                      >
                        {showCopied ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <RiFileCopyLine className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : currentUser.kyc?.status === 'verified' ? (
                <div className="text-center py-4">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    {t('profile.noBankAccount')}
                  </div>
                  <button
                    onClick={() => navigate('/support')}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('profile.contactSupport')}
                  </button>
                </div>
              ) : currentUser.kyc?.status === 'pending' ? (
                <div className="text-center py-4">
                  <div className="text-yellow-500 dark:text-yellow-400 mb-2">
                    {t('profile.kycPending')}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    {t('profile.kycRequired')}
                  </div>
                  <button
                    onClick={() => setShowKycForm(true)}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('profile.completeKyc')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification Section - Full Width */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RiShieldUserLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('profile.kycVerification')}</h2>
            </div>
            {currentUser.kyc?.status === 'verified' ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1.1, transition: { yoyo: Infinity, duration: 0.8 } }}
                className="px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center gap-1"
              >
                <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('kycStatus.verified')}
              </motion.span>
            ) : currentUser.kyc?.status === 'pending' ? (
              <span className="px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center gap-1">
                <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('kycStatus.pending')}
              </span>
            ) : (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                currentUser.kyc?.status === 'rejected' 
                  ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
              }`}>
                {t('kycStatus.' + (currentUser.kyc?.status || 'unverified'))}
              </span>
            )}
          </div>
        </div>
        {(currentUser.kyc?.status === 'unverified' || currentUser.kyc?.status === 'rejected') && (
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('profile.verifyIdentity')}
            </p>
            <button
              className="w-full px-6 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
              onClick={() => setShowKycForm(true)}
            >
              <RiShieldUserLine className="mr-2" size={20} />
              {currentUser.kyc?.status === 'rejected' ? t('profile.resubmitKyc') : t('profile.startKyc')}
            </button>
          </div>
        )}
        {currentUser.kyc?.status === 'pending' && (
          <div className="p-6">
            <div className="flex items-center justify-center space-x-3 text-yellow-600 dark:text-yellow-400">
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-center">
                {t('profile.kycPending')}
              </p>
            </div>
          </div>
        )}
      </div>

      {showKycForm && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <KYCForm onClose={() => setShowKycForm(false)} onSubmit={handleKycSubmit} />
        </div>,
        document.body
      )}
    </motion.div>
  )
}

export default Profile
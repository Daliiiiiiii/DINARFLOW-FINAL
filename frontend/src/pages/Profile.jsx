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
  RiLockLine 
} from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import ActionLoader from '../assets/animations/ActionLoader'
import KYCOverlay from '../layouts/KYCOverlay'
import KYCForm from '../components/ui/KYCForm'
import ReactDOM from 'react-dom'
import axios from 'axios'

const Profile = () => {
  const { currentUser, updateUserProfile, startKycVerification } = useAuth() // Get user and update function from context
  const { t } = useTranslation()
  
  const [profileImage, setProfileImage] = useState(currentUser?.profilePicture || null)
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showKycOverlay, setShowKycOverlay] = useState(false)
  const [showKycForm, setShowKycForm] = useState(false)
  const [bankAccount, setBankAccount] = useState(null)
  const [bankAccountLoading, setBankAccountLoading] = useState(false)

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
        formData.append('profileImage', file)
        
        const updatedUser = await updateUserProfile(formData)
        if (updatedUser?.profileImage) {
          setProfileImage(updatedUser.profileImage)
          toast.success(t('profile.success.imageUpdated'))
        }
      } catch (error) {
        console.error('Error uploading profile image:', error)
        toast.error(error.response?.data?.message || t('profile.errors.uploadFailed'))
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

  // Update local state when user data changes
  useEffect(() => {
    if (currentUser) {
      setProfileImage(currentUser.profilePicture || null)
      setPhoneNumber(currentUser.phoneNumber || '')
    }
  }, [currentUser])

  useEffect(() => {
    const fetchBankAccount = async () => {
      if (currentUser?.associatedBankAccount) {
        setBankAccountLoading(true);
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.get(`/api/bank-accounts/${currentUser.associatedBankAccount}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBankAccount(data.bankAccount);
        } catch (e) {
          setBankAccount(null);
        } finally {
          setBankAccountLoading(false);
        }
      }
    };
    fetchBankAccount();
  }, [currentUser]);

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
                        src={profileImage}
                        alt={`${currentUser.displayName}'s profile`}
                        className="w-full h-full object-cover transition-all duration-300"
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
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RiLockLine className="mr-1" size={16} />
                  {t('profile.availableAfterKyc')}
                </div>
              </div>
            </div>
            <div className="p-6">
              {currentUser.address ? (
                <span className="text-gray-900 dark:text-gray-100 font-medium">{currentUser.address}</span>
              ) : (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <span>{t('profile.completeKyc')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Associated Bank Account */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">{t('wallet.bankAccount')}</h2>
            {bankAccountLoading ? (
              <div className="text-gray-500">Loading bank account...</div>
            ) : bankAccount ? (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="mb-1 font-medium">{bankAccount.bankName}</div>
                <div className="mb-1 text-sm text-gray-500">{bankAccount.accountNumber}</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{bankAccount.balance?.toFixed(2) ?? '0.00'} TND</div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">{t('profile.noBankAccount') || 'No bank account assigned yet. Your bank account will be assigned after KYC review.'}</div>
            )}
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
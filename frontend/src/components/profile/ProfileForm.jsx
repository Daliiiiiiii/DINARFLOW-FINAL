import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { FaCamera } from 'react-icons/fa'
import api from '../../lib/axios'
import { RiShieldLine, RiShieldCheckLine } from 'react-icons/ri'
import KYCForm from '../ui/KYCForm'
import { toast } from 'react-toastify'

const ProfileForm = () => {
  const { userProfile, updateUserProfile, startKycVerification } = useAuth()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    phoneNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showKycForm, setShowKycForm] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // Load user data when profile is available
  useEffect(() => {
    if (userProfile) {
      // Strip the +216 prefix if it exists
      const phoneNumber = userProfile.phoneNumber || '';
      const digitsOnly = phoneNumber.replace(/^\+216/, '');
      setFormData({
        phoneNumber: digitsOnly,
      });
    }
  }, [userProfile])
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 8 digits
      const truncatedDigits = digitsOnly.slice(0, 8);
      
      setFormData(prev => ({ ...prev, [name]: truncatedDigits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    setIsSubmitting(true);
    
    try {
      await updateUserProfile({
        phoneNumber: '+216' + formData.phoneNumber
      });
      
      setSuccess('Phone number updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update phone number');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${path}`;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profilePicture', file)

    setUploadingPhoto(true)
    setError('')

    try {
      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      updateUserProfile(response.data.user)
      setSuccess('Profile picture updated successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile picture')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    setError('')

    try {
      const response = await api.delete('/api/users/profile-picture')
      updateUserProfile(response.data.user)
      setSuccess('Profile picture removed successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove profile picture')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleKycSubmit = async (formData) => {
    try {
      await startKycVerification(formData, {
        frontId: formData.frontId,
        backId: formData.backId,
        selfieWithId: formData.selfieWithId
      });
      setShowKycForm(false);
      toast.success('KYC submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit KYC');
    }
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="loader"></div>
      </div>
    )
  }

  const getKycStatusBadge = () => {
    const statusConfig = {
      pending: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'Pending',
        className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      },
      verified: {
        icon: <RiShieldCheckLine className="w-5 h-5" />,
        text: 'Verified',
        className: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      },
      rejected: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'Rejected',
        className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      },
      unverified: {
        icon: <RiShieldLine className="w-5 h-5" />,
        text: 'Not Verified',
        className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
      }
    }

    const config = statusConfig[userProfile.kyc?.status] || {
      icon: <RiShieldLine className="w-5 h-5" />,
      text: 'Not Verified',
      className: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
    }

    return (
      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
      
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg"
        >
          {success}
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div 
            className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={handlePhotoClick}
          >
            {userProfile.profilePicture ? (
              <>
                <img 
                  src={getImageUrl(userProfile.profilePicture)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaCamera className="text-white text-2xl" />
                </div>
              </>
            ) : (
              <div className="text-gray-400">
                <FaCamera className="text-3xl" />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />
        </div>
        {uploadingPhoto && (
          <div className="mt-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {userProfile.profilePicture && !uploadingPhoto && (
          <button
            onClick={handleRemovePhoto}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Remove Photo
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Current: {userProfile?.phoneNumber ? (
                <span>+216 {userProfile.phoneNumber.replace(/^\+216/, '')}</span>
              ) : 'Not set'}
            </p>
            <div className="relative">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Prevent non-numeric input
                  if (!/[\d\b]/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="XXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pl-12"
                maxLength={8}
                pattern="\d{8}"
                title="Please enter 8 digits for your phone number"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">+216</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Enter your Tunisian phone number (8 digits after +216)
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Phone Number'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">KYC Verification</h3>
            <p className="mt-1 text-sm text-gray-500">
              Verify your identity to access all features
            </p>
          </div>
          {getKycStatusBadge()}
        </div>

        {userProfile.kyc?.status !== 'in_progress' && (
          <button
            onClick={() => setShowKycForm(true)}
            className={`w-full btn ${
              userProfile.kyc?.status === 'rejected'
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : userProfile.kyc?.status === 'verified'
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
            }`}
          >
            {userProfile.kyc?.status === 'rejected'
              ? 'Resubmit KYC Documents'
              : userProfile.kyc?.status === 'verified'
              ? 'View KYC Details'
              : 'Start KYC Verification'}
          </button>
        )}

        {userProfile.kyc?.status === 'in_progress' && (
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center">
              <div className="mr-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
              </div>
              <p className="text-primary-700">
                Your KYC verification is being processed. This usually takes 1-2 business days.
              </p>
            </div>
          </div>
        )}
      </div>

      {showKycForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <KYCForm onClose={() => setShowKycForm(false)} onSubmit={handleKycSubmit} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileForm
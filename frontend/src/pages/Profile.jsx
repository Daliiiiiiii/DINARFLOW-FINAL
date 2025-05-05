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

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth() // Get user and update function from context
  const [profileImage, setProfileImage] = useState(currentUser?.profilePicture || null)
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Create a ref for the hidden file input
  const fileInputRef = useRef(null)

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('profileImage', file)
        
        const updatedUser = await updateUserProfile(formData)
        if (updatedUser?.profileImage) {
          setProfileImage(updatedUser.profileImage)
          toast.success('Profile picture updated successfully')
        }
      } catch (error) {
        console.error('Error uploading profile image:', error)
        toast.error(error.response?.data?.message || 'Failed to upload profile picture')
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
      toast.success('Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error(error.response?.data?.message || 'Failed to remove profile picture');
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

  // Update local state when user data changes
  useEffect(() => {
    if (currentUser) {
      setProfileImage(currentUser.profilePicture || null)
      setPhoneNumber(currentUser.phoneNumber || '')
    }
  }, [currentUser])

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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Personal Information</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your profile information and verification status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Image */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Photo</h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
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
                          Change Photo
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                      <RiUser3Line size={48} className="mb-2" />
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Add Photo</span>
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
                  <span>Remove Photo</span>
                </motion.button>
              )}

              {/* Helper Text */}
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Recommended: Square image, at least 400x400px
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Personal Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Name Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiUser3Line className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Full Name</h2>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RiLockLine className="mr-1" size={16} />
                  Read-only
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <span className="text-gray-900 dark:text-gray-100 font-medium">{currentUser.displayName}</span>
              </div>
            </div>
          </div>

          {/* Phone Number Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiPhoneLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Phone Number</h2>
                </div>
                <button
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-all duration-200"
                >
                  <RiEditLine className="mr-1" size={16} />
                  {isEditingPhone ? 'Cancel' : 'Edit'}
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
                      placeholder="Enter your phone number"
                    />
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Enter your Tunisian phone number (8 digits after +216)
                    </div>
                  </div>
                  <button
                    onClick={handlePhoneUpdate}
                    className="px-6 py-2.5 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Update Phone Number
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{phoneNumber}</span>
                  <span className="px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-full">
                    Current
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RiMapPinLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Address</h2>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <RiLockLine className="mr-1" size={16} />
                  Available after KYC
                </div>
              </div>
            </div>
            <div className="p-6">
              {currentUser.address ? (
                <span className="text-gray-900 dark:text-gray-100 font-medium">{currentUser.address}</span>
              ) : (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <span>Complete KYC verification to display your address</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification Section - Full Width */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RiShieldUserLine className="text-gray-400 dark:text-gray-500 mr-2" size={20} />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">KYC Verification</h2>
            </div>
            <span className="px-3 py-1 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
              {currentUser.kycStatus || 'Pending'}
            </span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Verify your identity to access all features and increase your transaction limits.
          </p>
          <button className="w-full px-6 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center">
            <RiShieldUserLine className="mr-2" size={20} />
            Start KYC Verification
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Profile
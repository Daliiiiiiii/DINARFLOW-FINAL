import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../lib/axios'
import { useTranslation } from 'react-i18next'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to format user data consistently
const formatUserData = (user) => {
  if (!user) return null;

  // Get the first part of the email (before @) if no display name is set
  const emailUsername = user.email?.split('@')[0] || '';

  // Ensure kyc object exists with proper structure
  const kyc = user.kyc || {};

  return {
    ...user,
    displayName: user.displayName || user.name || emailUsername || 'User',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    profilePicture: user.profilePicture || null, // Use null as fallback to trigger letter avatar
    role: user.role || 'user', // Ensure role is included with a default of 'user'
    kyc: {
      status: kyc.status || 'unverified',
      submittedAt: kyc.submittedAt || null,
      verifiedAt: kyc.verifiedAt || null,
      verificationNotes: kyc.verificationNotes || null,
      personalInfo: kyc.personalInfo || {},
      documents: kyc.documents || {}
    }
  };
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const validateImageFile = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  return true;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visualRole, setVisualRole] = useState(null)
  const { t } = useTranslation()

  useEffect(() => {
    // Check for existing token and validate session
    const checkAuth = async () => {
      try {
        // Check both localStorage and sessionStorage for token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Set the token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const { data } = await api.get('/api/auth/validate');
        console.log('Raw API response:', data);
        console.log('User data before formatting:', data.user);
        const formattedUser = formatUserData(data.user);
        console.log('Formatted user data:', formattedUser);
        setCurrentUser(formattedUser);
        setUserProfile(formattedUser);
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear tokens and headers on validation failure
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');

    // Handle different formats
    if (cleanPhone.startsWith('+216')) {
      const remainingDigits = cleanPhone.slice(4);
      if (!/^\d{8}$/.test(remainingDigits)) {
        throw new Error('Phone number must have exactly 8 digits after +216');
      }
      return cleanPhone;
    } else if (cleanPhone.startsWith('216')) {
      const remainingDigits = cleanPhone.slice(3);
      if (!/^\d{8}$/.test(remainingDigits)) {
        throw new Error('Phone number must have exactly 8 digits after 216');
      }
      return `+${cleanPhone}`;
    } else if (/^\d{8}$/.test(cleanPhone)) {
      return `+216${cleanPhone}`;
    }

    throw new Error('Invalid phone number format. Must be either +216XXXXXXXX, 216XXXXXXXX, or XXXXXXXX');
  }

  async function signup(email, password, firstName, lastName, displayName, phone) {
    try {
      const formattedPhone = validatePhoneNumber(phone)

      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        displayName,
        phoneNumber: formattedPhone
      })

      if (data.requiresVerification) {
        // Store email for verification
        localStorage.setItem('pendingVerificationEmail', email)
        return { requiresVerification: true, email }
      }

      localStorage.setItem('token', data.token)

      // Format user data consistently using the helper function
      const formattedUser = formatUserData(data.user);

      // Update state with formatted user data
      setCurrentUser(formattedUser);
      setUserProfile(formattedUser);

      toast.success('Account created successfully!')
      return formattedUser
    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create account'
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  async function verifyEmail(email, code) {
    try {
      const { data } = await api.post('/api/auth/verify-email', {
        email,
        code
      })

      localStorage.removeItem('pendingVerificationEmail')
      return data
    } catch (error) {
      console.error('Verification error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to verify email'
      throw new Error(errorMessage)
    }
  }

  async function resendVerificationCode(email) {
    try {
      await api.post('/api/auth/resend-verification', { email })
    } catch (error) {
      console.error('Resend verification error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to resend verification code'
      throw new Error(errorMessage)
    }
  }

  async function login(email, password, rememberMe = false) {
    try {
      const { data } = await api.post('/api/auth/login', {
        email,
        password,
        rememberMe
      });

      // If email is not verified, don't complete login
      if (!data.user.emailVerified) {
        return data.user;
      }

      // Store token with appropriate expiration
      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }

      // Set the token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      // Check for stored profile picture
      const storedProfilePicture = localStorage.getItem('profilePicture');

      // Format user data consistently
      const formattedUser = formatUserData({
        ...data.user,
        profilePicture: storedProfilePicture || data.user.profilePicture
      });

      // Update state with formatted user data
      setCurrentUser(formattedUser);
      setUserProfile(formattedUser);

      // Clear stored profile picture after restoring it
      if (storedProfilePicture) {
        localStorage.removeItem('profilePicture');
      }

      toast.success('Logged in successfully!');
      return formattedUser;
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing tokens and headers on login failure
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      toast.error(error.response?.data?.error || 'Failed to login');
      throw error;
    }
  }

  async function logout() {
    try {
      // Store profile picture before clearing data
      const profilePicture = currentUser?.profilePicture;

      // Disconnect WebSocket if it exists
      const socket = window.socket;
      if (socket) {
        console.log('Disconnecting WebSocket before logout');
        socket.disconnect();
        window.socket = null;
      }

      await api.post('/api/auth/logout');

      // Clear all auth-related data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Clear axios headers
      delete api.defaults.headers.common['Authorization'];

      // Reset state
      setCurrentUser(null);
      setUserProfile(null);

      // Restore profile picture if it exists
      if (profilePicture) {
        localStorage.setItem('profilePicture', profilePicture);
      }

      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear everything even if the server request fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      setUserProfile(null);
      toast.error('Error during logout');
    }
  }

  async function resetPassword(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response?.status === 404) {
        throw new Error('No account found with this email address. Please check and try again.');
      }
      throw new Error(error.response?.data?.error || 'Failed to send password reset email. Please try again.');
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/api/auth/update-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const updateUserProfile = async (data) => {
    try {
      const { data: response } = await api.put('/api/users/profile', data);
      const formattedUser = formatUserData(response.user);
      setCurrentUser(formattedUser);
      setUserProfile(formattedUser);
      return formattedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateWalletBalance = (newBalance) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, walletBalance: newBalance };
      console.log('[DEBUG] Updating currentUser balance:', updated);
      return updated;
    });
    setUserProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, walletBalance: newBalance };
      console.log('[DEBUG] Updating userProfile balance:', updated);
      return updated;
    });
  };

  async function startKycVerification(formData, files) {
    try {
      const formDataObj = new FormData();

      // Validate document types
      const validTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'frontId' && key !== 'backId' && key !== 'selfieWithId' && key !== 'signature') {
          formDataObj.append(key, formData[key]);
        }
      });

      // Validate files before upload
      const requiredFiles = ['frontId', 'backId', 'selfieWithId', 'signature'];
      const missingFiles = requiredFiles.filter(fileName => !formData.get(fileName));

      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }

      // Validate and append each file
      for (const fileName of requiredFiles) {
        const file = formData.get(fileName);
        if (file) {
          if (!validTypes.includes(file.type)) {
            throw new Error(`Invalid file type for ${fileName}. Only JPG and PNG images are allowed.`);
          }
          if (file.size > maxSize) {
            throw new Error(`File size too large for ${fileName}. Maximum size is 5MB.`);
          }
          formDataObj.append(fileName, file);
        }
      }

      // Log the FormData contents for debugging
      console.log('Submitting KYC documents with the following data:');
      for (let pair of formDataObj.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      const { data } = await api.post('/api/kyc/submit', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted);
        },
        timeout: 30000
      });

      // Update user state with new KYC status
      const updatedUser = {
        ...currentUser,
        kyc: {
          status: data.status || 'pending',
          submittedAt: new Date(),
          documents: data.documents,
          personalInfo: {
            idType: formData.get('idType'),
            idNumber: formData.get('idNumber'),
            dateOfBirth: formData.get('dateOfBirth'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            address: formData.get('address'),
            city: formData.get('city'),
            province: formData.get('province'),
            zipCode: formData.get('zipCode')
          }
        }
      };

      setCurrentUser(updatedUser);
      setUserProfile(updatedUser);

      // Store the updated user data in localStorage to persist across reloads
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return data;
    } catch (error) {
      console.error('KYC submission error:', error);
      throw error;
    }
  }

  const toggleVisualRole = () => {
    if (['admin', 'superadmin'].includes(currentUser?.role)) {
      setVisualRole(prev => prev === 'user' ? 'admin' : 'user')
    }
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    verifyEmail,
    resendVerificationCode,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateUserProfile,
    updateWalletBalance,
    startKycVerification,
    validatePhoneNumber,
    visualRole: visualRole || currentUser?.role,
    toggleVisualRole,
    isAdmin: ['admin', 'superadmin'].includes(currentUser?.role),
    isSuperAdmin: currentUser?.role === 'superadmin'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
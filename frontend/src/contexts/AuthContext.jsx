import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../lib/axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

        const { data } = await api.get('/api/auth/validate');
        const user = {
          ...data.user,
          displayName: data.user.displayName || data.user.name || data.user.email || 'User',
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || ''
        };
        setCurrentUser(user);
        setUserProfile(user);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '')
    if (!cleanPhone.startsWith('+216')) {
      throw new Error('Phone number must start with +216')
    }
    const remainingDigits = cleanPhone.slice(4)
    if (!/^\d{8}$/.test(remainingDigits)) {
      throw new Error('Phone number must have exactly 8 digits after +216')
    }
    return cleanPhone
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
      const user = {
        ...data.user,
        displayName: data.user.displayName || data.user.name || data.user.email || 'User',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || ''
      };
      setCurrentUser(user)
      setUserProfile(user)

      toast.success('Account created successfully!')
      return user
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
      
      // Store token with appropriate expiration
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
      
      const user = {
        ...data.user,
        displayName: data.user.displayName || data.user.name || data.user.email || 'User',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || ''
      };
      setCurrentUser(user);
      setUserProfile(user);

      toast.success('Logged in successfully!');
      return user;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Failed to login');
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
      // Clear both storage types
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setCurrentUser(null);
      setUserProfile(null);
      
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
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
      let response;
      
      if (data instanceof FormData) {
        // Handle file upload - ensure the file field name matches backend expectation
        const formData = new FormData();
        // If there's a profile image file, append it with the correct field name
        if (data.get('profileImage')) {
          formData.append('profilePicture', data.get('profileImage'));
        }
        // Append any other form data fields
        for (let [key, value] of data.entries()) {
          if (key !== 'profileImage') {
            formData.append(key, value);
          }
        }
        
        response = await api.post('/api/users/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else if (data.hasOwnProperty('profileImage') && data.profileImage === null) {
        // Handle profile picture removal
        response = await api.delete('/api/users/profile-picture');
      } else {
        // Handle regular profile updates
        response = await api.put('/api/users/profile', data);
      }

      const updatedUser = response.data;
      
      // Handle both possible response structures
      const userData = updatedUser.user || updatedUser;
      
      setCurrentUser(prev => ({ ...prev, ...userData }));
      setUserProfile(prev => ({ ...prev, ...userData }));
      
      toast.success('Profile updated successfully!');
      return userData;
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  async function acceptPrivacyPolicy() {
    try {
      const response = await api.post('/api/users/privacy-policy');
      setUserProfile(prev => ({
        ...prev,
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      }));
      toast.success('Privacy policy accepted!');
    } catch (error) {
      console.error('Accept privacy policy error:', error);
      toast.error(error.response?.data?.error || error.message);
      throw error;
    }
  }

  async function startKycVerification(formData, files) {
    try {
      const formDataObj = new FormData()
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'frontId' && key !== 'backId' && key !== 'selfieWithId') {
          formDataObj.append(key, formData[key])
        }
      })
      
      // Validate files before upload
      const requiredFiles = ['frontId', 'backId', 'selfieWithId'];
      const missingFiles = requiredFiles.filter(fileName => !files[fileName]);
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }

      // Append files with proper names
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File ${key} is too large. Maximum size is 5MB.`);
          }
          formDataObj.append(key, file);
        }
      });

      const { data } = await api.post('/api/kyc/submit', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('Upload progress:', percentCompleted);
        },
        timeout: 30000 // 30 second timeout
      });

      // Update user profile with KYC status
      setUserProfile(prev => ({
        ...prev,
        kyc: {
          ...prev.kyc,
          status: 'pending',
          submittedAt: new Date()
        }
      }));
      
      return data;
    } catch (error) {
      console.error('Start KYC verification error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit KYC verification';
      throw new Error(errorMessage);
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
    acceptPrivacyPolicy,
    startKycVerification,
    validatePhoneNumber
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  ThumbsUp,
  Clock,
  Shield,
  MessageSquare,
  User,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Search,
  Edit2,
  CreditCard,
  Ban as Bank,
  Save,
  ArrowLeft,
  X,
  Wallet,
  Building2,
  Smartphone,
  Camera,
  Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import BlockedUsers from '../components/BlockedUsers';
import { Dialog } from '@headlessui/react';

// Define payment methods outside the component
const PAYMENT_METHODS = [
  {
    id: 'tnd_wallet',
    name: 'Dinarflow TND Wallet',
    icon: Wallet,
    description: 'Pay using your TND wallet balance',
    processingTime: 'Instant',
    fee: '0%',
    isPopular: true
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Building2,
    description: 'Transfer directly to bank account',
    processingTime: '1-24 hours',
    fee: '0-1%',
    isPopular: true
  },
  {
    id: 'flouci',
    name: 'Flouci App',
    icon: Smartphone,
    description: 'Pay with Flouci app',
    processingTime: 'Instant',
    fee: '0%',
    isPopular: true
  },
  {
    id: 'd17',
    name: 'D17 App',
    icon: Smartphone,
    description: 'Pay with D17 app',
    processingTime: 'Instant',
    fee: '0%',
    isPopular: true
  },
  {
    id: 'postepay',
    name: 'Postepay',
    icon: CreditCard,
    description: 'Pay with Postepay',
    processingTime: 'Instant',
    fee: '0%',
    isPopular: true
  },
  {
    id: 'phone_balance',
    name: 'Phone Balance',
    icon: Smartphone,
    description: 'Pay using your phone credit',
    processingTime: 'Instant',
    fee: '0%',
    isPopular: true
  }
];

const PaymentMethodModal = ({ open, onClose, onSave, method, details, isEdit, paymentMethods, selectedMethods }) => {
  const [selectedMethod, setSelectedMethod] = useState(method || null);
  const [form, setForm] = useState(details || {});
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setForm(details || {});
    setSelectedMethod(method || null);
  }, [details, open, method]);

  const isFormValid = () => {
    if (!selectedMethod) return false;
    switch (selectedMethod.id) {
      case 'bank':
        return form.bankName && form.accountNumber && form.accountHolder;
      case 'flouci':
        return form.name && form.number && form.number.length === 8;
      case 'd17':
        return form.number && form.number.length === 8;
      case 'phone_balance':
        return form.provider && form.number && form.number.length === 8;
      case 'postepay':
        return form.accountNumber && form.accountHolder;
      case 'tnd_wallet':
        return true;
      default:
        return false;
    }
  };

  const availableMethods = paymentMethods.filter(pm => !selectedMethods.some(sel => sel.id === pm.id));

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'} rounded-xl p-6 border w-full max-w-md z-50`}>
        <Dialog.Title className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {isEdit ? 'Edit' : 'Add'} Payment Method
        </Dialog.Title>
        <div className="space-y-4">
          {!isEdit && (
            <select
              className={`w-full px-4 py-2 rounded-lg mb-2 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } border`}
              value={selectedMethod?.id || ''}
              onChange={e => {
                const m = availableMethods.find(pm => pm.id === e.target.value);
                setSelectedMethod(m);
                setForm({});
              }}
            >
              <option value="" disabled>Select Payment Method</option>
              {availableMethods.map(pm => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
          )}
          {selectedMethod && selectedMethod.id === 'bank' && (
            <>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Bank Name</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Bank Name (required)" 
                value={form.bankName||''} 
                onChange={e=>setForm(f=>({...f,bankName:e.target.value}))} 
              />
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Account Number</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Account Number (required, digits only)" 
                value={form.accountNumber||''} 
                onChange={e=>setForm(f=>({...f,accountNumber:e.target.value.replace(/\D/g,'')}))} 
              />
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Account Holder</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Account Holder (required, letters only)" 
                value={form.accountHolder||''} 
                onChange={e=>setForm(f=>({...f,accountHolder:e.target.value.replace(/[^a-zA-Z\s]/g,'')}))} 
              />
            </>
          )}
          {selectedMethod?.id === 'flouci' && (
            <>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Flouci Account Name</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Flouci Name (required)"
                value={form.name||''}
                onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              />
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Flouci Number</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Flouci Number (8 digits)"
                maxLength={8}
                value={form.number||''}
                onChange={e=>setForm(f=>({...f,number:e.target.value.replace(/\D/g,'')}))}
              />
            </>
          )}
          {selectedMethod?.id === 'd17' && (
            <>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>D17 Number</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="D17 Number (8 digits)"
                maxLength={8}
                value={form.number||''}
                onChange={e=>setForm(f=>({...f,number:e.target.value.replace(/\D/g,'')}))}
              />
            </>
          )}
          {selectedMethod?.id === 'phone_balance' && (
            <>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Provider</label>
              <select
                className={`w-full px-4 py-2 rounded-lg mb-2 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border`}
                value={form.provider||''}
                onChange={e=>setForm(f=>({...f,provider:e.target.value}))}
              >
                <option value="" disabled>Select provider</option>
                <option value="ooredoo">Ooredoo</option>
                <option value="tunisie_telecom">Tunisie Telecom</option>
                <option value="orange">Orange</option>
              </select>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Phone Number</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Phone Number (8 digits)"
                maxLength={8}
                value={form.number||''}
                onChange={e=>setForm(f=>({...f,number:e.target.value.replace(/\D/g,'')}))}
              />
            </>
          )}
          {selectedMethod?.id === 'postepay' && (
            <>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Account Number</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Account Number (required)"
                value={form.accountNumber||''}
                onChange={e=>setForm(f=>({...f,accountNumber:e.target.value}))}
              />
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-1`}>Account Holder</label>
              <input 
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Account Holder (required)"
                value={form.accountHolder||''}
                onChange={e=>setForm(f=>({...f,accountHolder:e.target.value}))}
              />
            </>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            onClick={onClose} 
            className={`flex-1 py-2 rounded-lg border ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button 
            onClick={()=>{ 
              console.log('PaymentMethodModal: selectedMethod at save:', selectedMethod);
              console.log('PaymentMethodModal: form at save:', form);
              onSave({id: selectedMethod?.id, details: form}); 
              setForm({}); 
              setSelectedMethod(null);
            }} 
            disabled={!isFormValid()} 
            className={`flex-1 py-2 rounded-lg border ${
              isDark 
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
            } font-semibold ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const P2PProfile = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isDark = theme === 'dark';
  let { userId } = useParams();
  console.log('userIdss', userId);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [modalMethod, setModalMethod] = useState(null);
  const [modalEditIdx, setModalEditIdx] = useState(null);
  const [modalDetails, setModalDetails] = useState({});
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);
  
  // Calculate if this is the user's own profile
  const isOwnProfile = !userId || userId === 'undefined' || userId === 'profile' || userId === currentUser?._id;
  
  // Handle navigation and profile fetching in a single effect
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const handleProfile = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        
        if (!currentUser?._id) {
          console.log('No current user found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        // Handle redirect first if needed
        if (!userId || userId === 'undefined' || userId === 'profile') {
          console.log('Redirecting to own profile');
          navigate(`/p2p/${currentUser._id}`, { replace: true });
          return;
        }

        const targetUserId = userId;
        const controller = new AbortController();
        
        try {
          console.log('Fetching profile for user:', targetUserId);
          const response = await api.get(`/api/p2p/profile/${targetUserId}`, {
            signal: controller.signal,
            timeout: 10000
          });
          
          if (!isMounted) {
            console.log('Component unmounted, aborting state updates');
            return;
          }
          
          console.log('Profile fetch successful:', response.data);
          const profileData = {
            ...response.data,
            userId: response.data.userId?._id || response.data.userId,
            nickname: response.data.nickname || currentUser.displayName || currentUser.email,
            paymentMethods: (response.data.paymentMethods || []).filter(pm => 
              PAYMENT_METHODS.some(m => m.id === pm.id)
            ),
            stats: response.data.stats || {
              totalVolume: 0,
              totalOrders: 0,
              completionRate: 0,
              avgResponseTime: '0m'
            },
            badges: response.data.badges || [],
            reviews: response.data.reviews || [],
            orders: response.data.orders || [],
            joinedDate: response.data.createdAt || new Date().toISOString()
          };
          
          setProfileData(profileData);
          setNickname(profileData.nickname);
          setSelectedMethods(profileData.paymentMethods);
          retryCount = 0;
        } catch (error) {
          if (!isMounted) {
            console.log('Component unmounted during error handling');
            return;
          }
          
          console.error('Profile fetch error:', error);
          
          if (error.name === 'AbortError' || error.message === 'canceled') {
            console.log('Request was aborted or cancelled');
            return;
          }

          if (error.response?.status === 404 && isOwnProfile) {
            console.log('Profile not found, attempting to create new profile');
            try {
              const createResponse = await api.put('/api/p2p/profile', {
                nickname: currentUser.displayName || currentUser.email,
                paymentMethods: []
              }, {
                signal: controller.signal,
                timeout: 10000
              });
              
              if (!isMounted) {
                console.log('Component unmounted during profile creation');
                return;
              }
              
              console.log('Profile creation successful:', createResponse.data);
              const newProfileData = {
                ...createResponse.data,
                userId: createResponse.data.userId?._id || createResponse.data.userId,
                nickname: createResponse.data.nickname || currentUser.displayName || currentUser.email,
                paymentMethods: createResponse.data.paymentMethods || [],
                stats: {
                  totalVolume: 0,
                  totalOrders: 0,
                  completionRate: 0,
                  avgResponseTime: '0m'
                },
                badges: [],
                reviews: [],
                orders: [],
                joinedDate: createResponse.data.createdAt || new Date().toISOString()
              };
              
              setProfileData(newProfileData);
              setNickname(newProfileData.nickname);
              setSelectedMethods(newProfileData.paymentMethods);
              setShowSuccessAnimation(true);
              toast.success('P2P profile created successfully');
              retryCount = 0;

              // Hide success animation after 3 seconds
              setTimeout(() => {
                setShowSuccessAnimation(false);
              }, 3000);
            } catch (createError) {
              if (!isMounted) {
                console.log('Component unmounted during profile creation error');
                return;
              }
              
              console.error('Profile creation error:', createError);
              if (createError.name === 'AbortError' || createError.message === 'canceled') {
                console.log('Create request was aborted or cancelled');
                return;
              }

              setShowErrorAnimation(true);
              toast.error(createError.response?.data?.message || 'Failed to create P2P profile');
              
              // Hide error animation after 3 seconds
              setTimeout(() => {
                setShowErrorAnimation(false);
              }, 3000);
              
              navigate('/p2p', { replace: true });
            }
          } else if (retryCount < maxRetries) {
            console.log(`Retrying profile fetch (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            setTimeout(handleProfile, 1000 * retryCount);
          } else {
            console.log('Max retries reached, navigating to P2P page');
            toast.error('Profile not found');
            navigate('/p2p', { replace: true });
          }
        }
      } catch (error) {
        if (!isMounted) {
          console.log('Component unmounted during outer error handling');
          return;
        }
        console.error('Outer profile error:', error);
        toast.error('Failed to load profile data');
        navigate('/p2p', { replace: true });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (currentUser?._id) {
      handleProfile();
    }

    return () => {
      console.log('Cleaning up profile effect');
      isMounted = false;
    };
  }, [userId, currentUser, navigate, isOwnProfile]);

  // If no current user, don't render anything
  if (!currentUser) {
    return null;
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no profile data and not own profile, show error
  if (!profileData && !isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl text-gray-400">Profile not found</div>
        <button
          onClick={() => navigate('/p2p')}
          className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400"
        >
          Return to P2P Trading
        </button>
      </div>
    );
  }

  // If no profile data and own profile, show loading
  if (!profileData && isOwnProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Ensure we have default values for all required fields
  const safeProfileData = {
    ...profileData,
    stats: profileData?.stats || {
      totalVolume: 0,
      totalOrders: 0,
      completionRate: 0,
      avgResponseTime: '0m'
    },
    badges: profileData?.badges || [],
    reviews: profileData?.reviews || [],
    orders: profileData?.orders || [],
    paymentMethods: profileData?.paymentMethods || [],
    nickname: profileData?.nickname || currentUser?.displayName || currentUser?.email || 'Anonymous',
    joinedDate: profileData?.joinedDate || profileData?.createdAt || new Date().toISOString()
  };

  const togglePaymentMethod = (methodId) => {
    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSave = async () => {
    try {
      await api.put('/api/p2p/profile', {
        nickname,
        paymentMethods: selectedMethods.map(pm => ({ id: pm.id, details: pm.details || {} }))
      });
      // Re-fetch profile
      const response = await api.get(`/api/p2p/profile/${currentUser._id}`);
      setProfileData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const fetchAndUpdateProfile = async () => {
    try {
      const response = await api.get(`/api/p2p/profile/${currentUser._id}`);
      setProfileData(response.data);
      setSelectedMethods(response.data.paymentMethods || []);
    } catch (error) {
      console.error('Failed to fetch updated profile:', error);
    }
  };

  const handleAddPaymentMethod = async (newMethod) => {
    try {
      // Fetch the latest profile from the backend
      const response = await api.get(`/api/p2p/profile/${currentUser._id}`);
      const backendMethods = response.data.paymentMethods || [];
      // Only add if not already present
      const updatedMethods = backendMethods.some(pm => pm.id === newMethod.id)
        ? backendMethods
        : [...backendMethods, newMethod];

      await api.put('/api/p2p/profile', {
        nickname,
        paymentMethods: updatedMethods
      });
      await fetchAndUpdateProfile();
      setShowMethodModal(false);
    } catch (error) {
      toast.error('Failed to add payment method');
    }
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploadingPicture(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/api/p2p/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update profile data with new picture
      setProfileData(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleDeletePicture = async () => {
    try {
      await api.delete('/api/p2p/profile/picture');
      setProfileData(prev => ({
        ...prev,
        profilePicture: null
      }));
      toast.success('Profile picture removed successfully');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-4 right-4 z-50"
          >
            <motion.div
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
              </motion.div>
              <div className="text-green-400 font-medium">Profile Created Successfully!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Animation */}
      <AnimatePresence>
        {showErrorAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-4 right-4 z-50"
          >
            <motion.div
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 flex items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 text-red-400" />
              </motion.div>
              <div className="text-red-400 font-medium">Failed to Create Profile</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <button
        onClick={() => navigate('/p2p')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'}`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to P2P Trading
      </button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`$${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-300'
        } border rounded-xl p-6`}
      >
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {profileData?.profilePicture ? (
                <img
                  src={profileData.profilePicture}
                  alt={profileData.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-blue-700'}`} />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
                  disabled={isUploadingPicture}
                >
                  <Camera className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                {profileData?.profilePicture && (
                  <button
                    onClick={handleDeletePicture}
                    className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
                  >
                    <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePictureUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{safeProfileData.nickname}</h1>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'} rounded-lg`}
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1`}>
              Member since {new Date(safeProfileData.joinedDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Total Orders</div>
            <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{safeProfileData.stats.totalOrders}</div>
          </div>
          <div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Completion Rate</div>
            <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{safeProfileData.stats.completionRate}%</div>
          </div>
          <div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Avg. Response Time</div>
            <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{safeProfileData.stats.avgResponseTime}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-3">
          {safeProfileData.badges.map((badge, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                badge.color === 'blue'
                  ? (isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                  : badge.color === 'green'
                  ? (isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700')
                  : (isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
              }`}
            >
              <badge.icon className="w-4 h-4" />
              {badge.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment Methods Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`$${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-300'
        } border rounded-xl p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PAYMENT_METHODS.filter(method => selectedMethods.some(pm => pm.id === method.id)).map((method, idx) => {
            const pm = selectedMethods.find(p => p.id === method.id);
            if (!pm) return null;
            return (
              <div key={pm.id} className={`flex items-start justify-between p-4 rounded-xl border ${
                isDark 
                  ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                  : 'bg-white border-gray-300'
              }`}>
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${
                    isDark 
                      ? 'bg-gray-800' 
                      : 'bg-gray-100'
                  } flex items-center justify-center mt-1`}>
                    <method.icon className={`w-5 h-5 ${
                      isDark 
                        ? 'text-gray-400' 
                        : 'text-gray-700'
                    }`} />
                  </div>
                  <div className="flex flex-col">
                    <div className={`font-medium ${
                      isDark 
                        ? 'text-white' 
                        : 'text-gray-900'
                    }`}>{method.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'} mt-1 space-y-1`}>
                      {pm.details && Object.entries(pm.details).map(([key, value]) => (
                        <div key={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {method.id !== 'tnd_wallet' && (
                    <button 
                      onClick={()=>{setModalMethod(method);setModalEditIdx(idx);setModalDetails(pm.details||{});setShowMethodModal(true);}} 
                      className={`p-2 rounded-lg ${
                        isDark 
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' 
                          : 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200'
                      } border text-sm font-semibold`}
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={()=>setConfirmDeleteIdx(idx)} 
                    className={`p-2 rounded-lg ${
                      isDark 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                        : 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                    } border text-sm font-semibold`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {selectedMethods.length < PAYMENT_METHODS.length && (
          <button
            className={`mt-4 px-4 py-2 rounded-lg border font-semibold ${
              isDark
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
            }`}
            onClick={() => {
              setModalMethod(null);
              setModalEditIdx(null);
              setModalDetails({});
              setShowMethodModal(true);
            }}
          >
            Add Payment Method
          </button>
        )}
      </motion.div>

      {/* Only show tabs for other users' profiles */}
      {!isOwnProfile && (
        <>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 -mb-px transition-colors ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 -mb-px transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Order History
            </button>
          </div>

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {safeProfileData.reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    isDark 
                      ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                      : 'bg-white border-gray-200'
                  } border rounded-xl p-6`}
                >
                  {/* Review content */}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add this section where appropriate in your profile layout */}
      <div className="mt-8">
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Blocked Users</h2>
        <BlockedUsers />
      </div>

      <PaymentMethodModal
        open={showMethodModal}
        onClose={()=>setShowMethodModal(false)}
        onSave={newlyAddedMethod=>{
          if(modalEditIdx!==null) {
            setSelectedMethods(prev=>prev.map((pm,i)=>i===modalEditIdx?{...pm,details:newlyAddedMethod.details}:pm));
          } else {
            handleAddPaymentMethod(newlyAddedMethod);
          }
          setShowMethodModal(false);
        }}
        method={modalMethod}
        details={modalDetails}
        isEdit={modalEditIdx!==null}
        paymentMethods={PAYMENT_METHODS}
        selectedMethods={selectedMethods}
      />

      {confirmDeleteIdx!==null && (
        <Dialog open={true} onClose={()=>setConfirmDeleteIdx(null)} className="fixed z-50 inset-0 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="bg-white rounded-xl p-6 border border-gray-300 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-bold mb-2 text-gray-900">Remove Payment Method?</Dialog.Title>
            <p className="mb-4 text-gray-700">Are you sure you want to remove this payment method?</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setConfirmDeleteIdx(null)} className="flex-1 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700">Cancel</button>
              <button onClick={async () => {
                try {
                  // Get the updated methods after deletion
                  const updatedMethods = selectedMethods.filter((_, i) => i !== confirmDeleteIdx);
                  
                  // Save to backend
                  await api.put('/api/p2p/profile', {
                    nickname,
                    paymentMethods: updatedMethods
                  });
                  
                  // Update local state
                  setSelectedMethods(updatedMethods);
                  setConfirmDeleteIdx(null);
                  toast.success('Payment method removed successfully');
                } catch (error) {
                  console.error('Failed to remove payment method:', error);
                  toast.error('Failed to remove payment method');
                }
              }} className="flex-1 py-2 rounded-lg border border-red-300 bg-red-100 text-red-700 font-semibold">Remove</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default P2PProfile;
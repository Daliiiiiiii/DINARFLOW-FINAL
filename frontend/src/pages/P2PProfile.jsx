import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

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
  
  // Calculate if this is the user's own profile
  const isOwnProfile = !userId || userId === 'undefined' || userId === 'profile' || userId === currentUser?._id;
  
  // Handle navigation and profile fetching in a single effect
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
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
        console.log('userId', userId);

        // Handle redirect first if needed
        if (!userId || userId === 'undefined' || userId === 'profile') {
          console.log('Redirecting to own profile');
          navigate(`/p2p/${currentUser._id}`, { replace: true });
          return; // Let the effect re-run with the new URL
        }
        // Use the userId from URL
        const targetUserId = userId;
        
        console.log('Fetching profile for user:', targetUserId);
        console.log('Current user ID:', currentUser._id);
        console.log('URL user ID:', userId);
        console.log('Is own profile:', isOwnProfile);

        try {
          const response = await axios.get(`/api/p2p/profile/${targetUserId}`, {
            signal: controller.signal,
            timeout: 5000
          });
          
          if (!isMounted) return;
          
          console.log('Raw profile fetch response:', JSON.stringify(response.data, null, 2));
          
          const profileData = {
            ...response.data,
            userId: response.data.userId?._id || response.data.userId,
            nickname: response.data.nickname || currentUser.displayName || currentUser.email,
            paymentMethods: response.data.paymentMethods || [],
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
          
          console.log('Processed profile data:', JSON.stringify(profileData, null, 2));
          setProfileData(profileData);
          setNickname(profileData.nickname);
          setSelectedMethods(profileData.paymentMethods);
          retryCount = 0;
        } catch (error) {
          if (!isMounted) return;
          
          if (error.name === 'AbortError' || error.message === 'canceled') {
            console.log('Request was aborted or cancelled');
            return;
          }

          console.error('Profile fetch error:', error.response?.data);
          console.error('Error status:', error.response?.status);
          console.error('Error details:', error);
          
          if (error.response?.status === 404 && isOwnProfile) {
            console.log('Profile not found for own user, attempting to create');
            try {
              const createResponse = await axios.put('/api/p2p/profile', {
                nickname: currentUser.displayName || currentUser.email,
                paymentMethods: []
              }, {
                signal: controller.signal,
                timeout: 5000
              });
              
              if (!isMounted) return;
              
              console.log('Raw profile creation response:', JSON.stringify(createResponse.data, null, 2));
              
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
              
              console.log('Processed new profile data:', JSON.stringify(newProfileData, null, 2));
              setProfileData(newProfileData);
              setNickname(newProfileData.nickname);
              setSelectedMethods(newProfileData.paymentMethods);
              toast.success('P2P profile created successfully');
              retryCount = 0;
            } catch (createError) {
              if (!isMounted) return;
              
              if (createError.name === 'AbortError' || createError.message === 'canceled') {
                console.log('Create request was aborted or cancelled');
                return;
              }

              console.error('Failed to create profile:', createError);
              console.error('Create error response:', createError.response?.data);
              toast.error(createError.response?.data?.message || 'Failed to create P2P profile');
              navigate('/p2p', { replace: true });
            }
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying profile fetch (${retryCount}/${maxRetries})...`);
            setTimeout(handleProfile, 1000 * retryCount);
            return;
          } else {
            toast.error('Profile not found');
            navigate('/p2p', { replace: true });
          }
        }
      } catch (error) {
        if (!isMounted) return;
        
        if (error.name === 'AbortError' || error.message === 'canceled') {
          console.log('Request was aborted or cancelled');
          return;
        }

        console.error('Profile error:', error);
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
      isMounted = false;
      controller.abort();
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

  const paymentMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Bank,
      description: 'Transfer directly to bank account',
      processingTime: '1-24 hours',
      fee: '0-1%',
      isPopular: true
    },
    {
      id: 'flouci',
      name: 'Flouci',
      icon: CreditCard,
      description: 'Pay with Flouci app',
      processingTime: 'Instant',
      fee: '0%',
      isPopular: true
    },
    {
      id: 'd17',
      name: 'D17',
      icon: CreditCard,
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
    }
  ];

  const togglePaymentMethod = (methodId) => {
    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`/api/p2p/profile/${currentUser._id}`, {
        nickname,
        paymentMethods: selectedMethods
      });
      setProfileData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/p2p')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to P2P Trading
      </button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl p-6`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              {isOwnProfile && isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleSave}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{safeProfileData.nickname}</h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="text-gray-400 mt-1">
                Member since {new Date(safeProfileData.joinedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-gray-400">Total Volume</div>
              <div className="text-xl font-semibold text-white">{safeProfileData.stats.totalVolume} TND</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div>
            <div className="text-gray-400">Total Orders</div>
            <div className="text-2xl font-semibold text-white">{safeProfileData.stats.totalOrders}</div>
          </div>
          <div>
            <div className="text-gray-400">Completion Rate</div>
            <div className="text-2xl font-semibold text-white">{safeProfileData.stats.completionRate}%</div>
          </div>
          <div>
            <div className="text-gray-400">Avg. Response Time</div>
            <div className="text-2xl font-semibold text-white">{safeProfileData.stats.avgResponseTime}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-3">
          {safeProfileData.badges.map((badge, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                badge.color === 'blue'
                  ? 'bg-blue-900/20 text-blue-400'
                  : badge.color === 'green'
                  ? 'bg-green-900/20 text-green-400'
                  : 'bg-yellow-900/20 text-yellow-400'
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
        className={`${
          isDark 
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
            : 'bg-white border-gray-200'
        } border rounded-xl p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Payment Methods</h2>
          {isOwnProfile && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm"
            >
              Save Changes
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => isOwnProfile && togglePaymentMethod(method.id)}
              className={`p-4 rounded-xl border ${
                safeProfileData.paymentMethods.includes(method.id)
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              } transition-all ${!isOwnProfile && 'cursor-default'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${
                  safeProfileData.paymentMethods.includes(method.id)
                    ? 'bg-blue-500/20'
                    : 'bg-white/5'
                } flex items-center justify-center`}>
                  <method.icon className={`w-5 h-5 ${
                    safeProfileData.paymentMethods.includes(method.id)
                      ? 'text-blue-400'
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{method.name}</span>
                    {method.isPopular && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{method.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {method.processingTime}
                    </span>
                    <span>Fee: {method.fee}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
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
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={review.user.avatar} 
                        alt={review.user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{review.user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{review.date}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-400'
                              }`}
                              fill={i < review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">{review.comment}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full ${
                          review.type === 'buy'
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {review.type === 'buy' ? 'Bought' : 'Sold'}
                        </span>
                        <span>{review.orderAmount}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {safeProfileData.orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    isDark 
                      ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800' 
                      : 'bg-white border-gray-200'
                  } border rounded-xl p-6`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        order.type === 'buy'
                          ? 'bg-green-900/20 text-green-400'
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {order.type === 'buy' ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {order.type === 'buy' ? 'Bought' : 'Sold'} {order.amount}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Price</div>
                        <div className="font-medium">{order.price}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                        <div className="font-medium">{order.total}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                        <div className={`inline-flex items-center gap-1 ${
                          order.status === 'completed'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          {order.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={order.buyer.avatar} 
                          alt={order.buyer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.buyer.name}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default P2PProfile;
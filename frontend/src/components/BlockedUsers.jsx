import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get('/api/users/blocked');
      // Fetch P2P profiles for each blocked user
      const usersWithProfiles = await Promise.all(
        response.data.map(async (user) => {
          try {
            const profileResponse = await axios.get(`/api/p2p/profile/${user._id}`);
            return { 
              ...user, 
              p2pNickname: profileResponse.data.nickname,
              p2pProfilePicture: profileResponse.data.profilePicture
            };
          } catch (error) {
            console.error('Error fetching P2P profile:', error);
            return user;
          }
        })
      );
      setBlockedUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Failed to fetch blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axios.delete(`/api/p2p/block/${userId}`);
      toast.success('User unblocked successfully');
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  if (loading) {
    return <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Loading blocked users...</div>;
  }

  if (blockedUsers.length === 0) {
    return <div className={`text-center ${isDark ? 'text-gray-400 bg-gray-900/50 border-gray-800' : 'text-gray-700 bg-white border-gray-300'} rounded-xl p-6 font-medium border`}>No blocked users</div>;
  }

  return (
    <div className="space-y-4">
      {blockedUsers.map(user => (
        <div key={user._id} className={`flex items-center justify-between p-4 rounded-xl border ${
          isDark
            ? 'bg-gray-900/50 backdrop-blur-sm border-gray-800'
            : 'bg-white border-gray-300'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100 border-gray-300'}`}>
              {user.p2pProfilePicture ? (
                <img 
                  src={user.p2pProfilePicture} 
                  alt={user.p2pNickname || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-blue-700'}`} />
              )}
            </div>
            <div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user.p2pNickname || 'Loading...'}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleUnblock(user._id)}
            className={`px-4 py-2 rounded-lg border text-sm transition-all flex items-center gap-2 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-red-100 hover:bg-red-200 border-red-300 text-red-700'}`}
          >
            <X className="w-4 h-4" />
            Unblock
          </button>
        </div>
      ))}
    </div>
  );
};

export default BlockedUsers; 
import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get('/api/users/blocked');
      setBlockedUsers(response.data);
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
      // Remove the unblocked user from the list
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading blocked users...</div>;
  }

  if (blockedUsers.length === 0) {
    return <div className="text-gray-400">No blocked users</div>;
  }

  return (
    <div className="space-y-4">
      {blockedUsers.map(user => (
        <div key={user._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="font-medium text-white">{user.nickname || user.username || 'Unknown User'}</div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => handleUnblock(user._id)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-sm transition-all flex items-center gap-2"
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
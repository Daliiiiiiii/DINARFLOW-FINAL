import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { RiCheckLine, RiCloseLine, RiHistoryLine, RiDeleteBinLine } from 'react-icons/ri';
import { getImageUrl } from '../../utils/urlUtils';

const KycVerificationPanel = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    fetchPendingKycUsers();
  }, []);

  const fetchPendingKycUsers = async () => {
    try {
      const response = await fetch('/api/kyc/admin/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrail = async (userId) => {
    try {
      const response = await fetch(`/api/kyc/admin/audit/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAuditTrail(data.audit);
      setShowAudit(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerification = async (userId, status, reason = '') => {
    try {
      const response = await fetch(`/api/kyc/admin/verify/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Update local state
      setUsers(users.filter(user => user._id !== userId));
      setSelectedUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this KYC data?')) return;
    
    try {
      const response = await fetch(`/api/kyc/admin/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Update local state
      setUsers(users.filter(user => user._id !== userId));
      setSelectedUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending KYC Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Pending KYC Verifications
          </h2>
          
          <div className="space-y-4">
            {users.map(user => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchAuditTrail(user._id);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <RiHistoryLine className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {users.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No pending KYC verifications
              </p>
            )}
          </div>
        </div>

        {/* Selected User Details */}
        {selectedUser && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              KYC Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Personal Information</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Type</p>
                    <p className="font-medium">{selectedUser.kycData.idType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{selectedUser.kycData.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{selectedUser.kycData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">{selectedUser.kycData.nationality}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Documents</h3>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Front</p>
                    <img
                      src={getImageUrl(selectedUser.kycData.idFrontUrl)}
                      alt="ID Front"
                      className="mt-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Back</p>
                    <img
                      src={getImageUrl(selectedUser.kycData.idBackUrl)}
                      alt="ID Back"
                      className="mt-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Selfie with ID</p>
                    <img
                      src={getImageUrl(selectedUser.kycData.selfieUrl)}
                      alt="Selfie with ID"
                      className="mt-2 rounded-lg border"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => handleDelete(selectedUser._id)}
                  className="btn-outline text-red-600 hover:bg-red-50"
                >
                  <RiDeleteBinLine className="w-5 h-5 mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => handleVerification(selectedUser._id, 'rejected', 'Documents do not meet requirements')}
                  className="btn-outline text-red-600 hover:bg-red-50"
                >
                  <RiCloseLine className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleVerification(selectedUser._id, 'verified')}
                  className="btn-primary"
                >
                  <RiCheckLine className="w-5 h-5 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail Modal */}
        {showAudit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">KYC Audit Trail</h2>
                <button
                  onClick={() => setShowAudit(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RiCloseLine className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {auditTrail.map((audit, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between">
                      <p className="font-medium">{audit.action}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(audit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {audit.reason && (
                      <p className="text-sm text-gray-600 mt-1">{audit.reason}</p>
                    )}
                    {audit.verifiedBy && (
                      <p className="text-sm text-gray-500 mt-1">
                        Verified by: {audit.verifiedBy.displayName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycVerificationPanel; 
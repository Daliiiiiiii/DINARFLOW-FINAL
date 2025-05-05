import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

const PrivacyPolicyForm = ({ onClose }) => {
  const { acceptPrivacyPolicy } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!accepted) {
      setError('You must accept the privacy policy to continue')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      await acceptPrivacyPolicy()
      onClose()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto"
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Policy</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="prose prose-sm max-h-96 overflow-y-auto mb-6">
        <h4>1. Information We Collect</h4>
        <p>
          We collect information you provide directly to us, including but not limited to:
          personal information, transaction data, and usage information.
        </p>
        
        <h4>2. How We Use Your Information</h4>
        <p>
          We use the information we collect to provide, maintain, and improve our services,
          to process your transactions, and to communicate with you.
        </p>
        
        <h4>3. Information Sharing and Security</h4>
        <p>
          We do not sell or rent your personal information to third parties. We implement
          appropriate security measures to protect your information.
        </p>
        
        <h4>4. Your Rights</h4>
        <p>
          You have the right to access, correct, or delete your personal information.
          You can also object to or restrict certain processing of your information.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              I have read and agree to the privacy policy and consent to the collection
              and processing of my personal information as described above.
            </span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !accepted}
            className="btn-primary"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              'Accept & Continue'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default PrivacyPolicyForm
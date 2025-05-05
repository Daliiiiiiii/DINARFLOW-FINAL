import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { RiUpload2Line } from 'react-icons/ri'
import api from '../../lib/axios'

const KycVerificationForm = ({ onClose }) => {
  const { startKycVerification } = useAuth()
  
  const [formData, setFormData] = useState({
    idType: '',
    idNumber: '',
    dateOfBirth: ''
  })
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${path}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'idNumber') {
      // Only allow numbers and limit to 8 digits
      const numbersOnly = value.replace(/\D/g, '').slice(0, 8)
      setFormData(prev => ({ ...prev, [name]: numbersOnly }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target
    if (uploadedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: uploadedFiles[0] }))
    }
  }

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.idType || !formData.idNumber || !formData.dateOfBirth) {
      setError('Please fill in all required fields')
      return
    }
    
    // Age validation
    const age = calculateAge(formData.dateOfBirth)
    if (age < 18) {
      setError('You must be at least 18 years old to register')
      return
    }
    
    if (!files.idFront || !files.idBack || !files.selfie) {
      setError('Please upload all required documents')
      return
    }

    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if ([files.idFront, files.idBack, files.selfie].some(file => file.size > maxSize)) {
      setError('One or more files exceed the 5MB size limit')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      await startKycVerification(formData, files)
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
      className="bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto"
    >
      <div className="sticky top-0 bg-white pb-4 border-b border-gray-100 mb-6 z-10">
        <h3 className="text-lg font-medium text-gray-900">KYC Verification</h3>
        <p className="text-sm text-gray-600 mt-1">Please provide your information for verification</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">
              ID Type *
            </label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select ID Type</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
              ID Number *
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="input-field"
              pattern="\d{8}"
              inputMode="numeric"
              minLength={8}
              maxLength={8}
              required
            />
          </div>
          
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth * <span className="text-xs text-gray-500">(Must be 18 or older)</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="input-field"
              required
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Document Upload</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Front Side *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {files.idFront ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-primary-600">{files.idFront.name}</p>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => ({ ...prev, idFront: null }))}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <RiUpload2Line className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="idFront" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          id="idFront"
                          name="idFront"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Back Side *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {files.idBack ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-primary-600">{files.idBack.name}</p>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => ({ ...prev, idBack: null }))}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <RiUpload2Line className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="idBack" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          id="idBack"
                          name="idBack"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selfie with ID *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {files.selfie ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-primary-600">{files.selfie.name}</p>
                    <button
                      type="button"
                      onClick={() => setFiles(prev => ({ ...prev, selfie: null }))}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <RiUpload2Line className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="selfie" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          id="selfie"
                          name="selfie"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default KycVerificationForm
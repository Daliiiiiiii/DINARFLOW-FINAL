import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import Button from '../ui/Button'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

// Move PasswordInput outside main component and memoize it
const PasswordInput = memo(({ label, name, value, onChange, showPassword, onToggleVisibility, placeholder }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <RiLockLine className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                 placeholder-gray-500 dark:placeholder-gray-400
                 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400
                 transition-colors duration-200"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {showPassword ? (
          <RiEyeOffLine className="h-5 w-5" />
        ) : (
          <RiEyeLine className="h-5 w-5" />
        )}
      </button>
    </div>
  </div>
))

const PasswordUpdateForm = ({ onClose }) => {
  const { updatePassword } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validatePassword = (password) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      requirements: [
        { text: 'At least 8 characters', met: password.length >= minLength },
        { text: 'One uppercase letter', met: hasUpperCase },
        { text: 'One lowercase letter', met: hasLowerCase },
        { text: 'One number', met: hasNumbers }
      ]
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    const validation = validatePassword(formData.newPassword)
    if (!validation.isValid) {
      setError('Password does not meet requirements')
      return
    }
    
    setLoading(true)
    try {
      await updatePassword(formData.currentPassword, formData.newPassword)
      toast.success('Password updated successfully')
      onClose()
    } catch (error) {
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 'An error occurred while updating your password'
      setError(errorMessage)
      // Clear the form fields on error for security
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }))
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validation = validatePassword(formData.newPassword)
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
        <PasswordInput
          label="Current Password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
          showPassword={showPasswords.currentPassword}
          onToggleVisibility={() => togglePasswordVisibility('currentPassword')}
          placeholder="Enter your current password"
        />

        <PasswordInput
          label="New Password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
          showPassword={showPasswords.newPassword}
          onToggleVisibility={() => togglePasswordVisibility('newPassword')}
          placeholder="Enter your new password"
        />

        <div className="mt-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Requirements:
          </div>
          <div className="space-y-2">
            {validation.requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-center text-sm"
              >
                {req.met ? (
                  <RiCheckLine className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <RiCloseLine className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                )}
                <span className={`${
                  req.met 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
          </div>
          
        <PasswordInput
          label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
          showPassword={showPasswords.confirmPassword}
          onToggleVisibility={() => togglePasswordVisibility('confirmPassword')}
          placeholder="Confirm your new password"
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <div className="flex">
            <RiCloseLine className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}
        
      <div className="flex justify-end space-x-3">
        <Button
            type="button"
          variant="secondary"
            onClick={onClose}
          className="w-full sm:w-auto"
          >
            Cancel
        </Button>
        <Button
            type="submit"
          disabled={loading || !validation.isValid || formData.newPassword !== formData.confirmPassword}
          className="w-full sm:w-auto"
          >
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
        </div>
      </form>
  )
}

export default PasswordUpdateForm
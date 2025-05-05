import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiBankLine, 
  RiArrowLeftLine, 
  RiInformationLine,
  RiLockLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiWalletLine,
  RiCheckLine,
  RiExchangeLine,
  RiArrowRightLine,
  RiAddLine,
  RiStarLine,
  RiStarFill,
  RiDeleteBinLine,
  RiCloseLine
} from 'react-icons/ri'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const BankTransfer = () => {
  const { userProfile } = useAuth()
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    amount: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showMoveFunds, setShowMoveFunds] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [savedAccounts, setSavedAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    accountNumber: ''
  })

  useEffect(() => {
    fetchSavedAccounts()
  }, [])

  const fetchSavedAccounts = async () => {
    try {
      const response = await axios.get('/api/bank-accounts')
      setSavedAccounts(response.data)
    } catch (error) {
      toast.error('Failed to load saved accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (parseFloat(formData.amount) < 1) {
      toast.error('Minimum transfer amount is 1 TND')
      return
    }

    setIsSubmitting(true)
    
    try {
      // If we're adding a new account, save it first
      if (showAddAccount) {
        await handleAddNewAccount()
      }

      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setShowSuccess(true)
      toast.success('Transfer initiated successfully!')
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setFormData(prev => ({
          ...prev,
          accountNumber: '',
          name: '',
          amount: '',
          description: ''
        }))
        setSelectedAccount(null)
        setShowAddAccount(false)
      }, 3000)
    } catch (error) {
      toast.error('Failed to process transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAmountChange = (e) => {
    const value = e.target.value
    if (value === '' || (parseFloat(value) >= 1 && !isNaN(value))) {
      setFormData(prev => ({
        ...prev,
        amount: value
      }))
    }
  }

  const handleMoveFunds = () => {
    setShowMoveFunds(true)
    // Simulate moving funds
    setTimeout(() => {
      setShowMoveFunds(false)
    }, 2000)
  }

  const handleAccountSelect = (account) => {
    setSelectedAccount(account)
    setShowAddAccount(false)
    setFormData(prev => ({
      ...prev,
      accountNumber: account.accountNumber,
      name: account.name
    }))
  }

  const handleToggleDefault = async (account) => {
    try {
      await axios.patch(`/api/bank-accounts/${account._id}/toggle-default`)
      await fetchSavedAccounts()
      toast.success('Default account updated successfully')
    } catch (error) {
      toast.error('Failed to update default account')
    }
  }

  const handleDeleteAccount = async (account) => {
    try {
      await axios.delete(`/api/bank-accounts/${account._id}`)
      await fetchSavedAccounts()
      if (selectedAccount?._id === account._id) {
        setSelectedAccount(null)
        setFormData(prev => ({
          ...prev,
          accountNumber: '',
          name: ''
        }))
      }
      toast.success('Account deleted successfully')
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  const handleAddNewAccount = async () => {
    try {
      // Validate required fields
      if (!newAccountData.accountNumber || !newAccountData.name) {
        toast.error('Please fill in all required fields')
        return
      }

      // Create new account
      const response = await axios.post('/api/bank-accounts', {
        name: newAccountData.name,
        accountNumber: newAccountData.accountNumber,
        isDefault: false
      })

      // Update the saved accounts list
      await fetchSavedAccounts()
      
      // Show success message
      toast.success('Account added successfully')
      
      // Close modal and reset form
      setShowAddAccountModal(false)
      setNewAccountData({
        name: '',
        accountNumber: ''
      })
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error(error.response?.data?.message || 'Failed to add account')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/wallet" 
          className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 group"
        >
          <motion.div
            whileHover={{ x: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <RiArrowLeftLine className="mr-2" size={20} />
          </motion.div>
          Back to Wallet
        </Link>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMoveFunds}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <RiExchangeLine size={20} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Quick Transfer</p>
            <p className="text-xs opacity-80">Move funds instantly</p>
          </div>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center mr-4">
                  <RiBankLine className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Bank Account</h1>
                  <p className="text-gray-500 dark:text-gray-400">Manage your bank accounts and transfers</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Enter account number"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (TND)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 pr-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                    min="1"
                    step="1"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                    TND
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Enter description"
                  required
                />
              </div>

              <div className="pt-4">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 relative overflow-hidden disabled:bg-primary-300 dark:disabled:bg-primary-700/50"
                  disabled={isSubmitting}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <span>Transfer Now</span>
                        <RiArrowRightLine className="ml-2" size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Saved Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Saved Accounts</h2>
              <button 
                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                onClick={() => setShowAddAccountModal(true)}
              >
                <RiAddLine className="mr-1" size={18} />
                <span className="text-sm font-medium">Add New Account</span>
              </button>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary-500 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : savedAccounts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No saved accounts yet
                </div>
              ) : (
                savedAccounts.map((account) => (
                  <motion.div
                    key={account._id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedAccount?._id === account._id
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center flex-1"
                        onClick={() => handleAccountSelect(account)}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                          <RiBankLine className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{account.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleDefault(account)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                        >
                          {account.isDefault ? (
                            <RiStarFill className="text-yellow-500 dark:text-yellow-400" size={20} />
                          ) : (
                            <RiStarLine className="text-gray-400 dark:text-gray-500" size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                        >
                          <RiDeleteBinLine className="text-red-500 dark:text-red-400" size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-500 dark:to-primary-700 rounded-xl shadow-card p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Available Balance</h3>
              <RiWalletLine size={24} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">
              {userProfile?.walletBalance?.toFixed(2) || '0.00'} TND
            </p>
            <p className="text-sm opacity-80">Last updated: {new Date().toLocaleString()}</p>
          </motion.div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Security Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <RiShieldCheckLine className="text-green-500 dark:text-green-400 mt-1 mr-3" size={20} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Secure Transfer</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">All transfers are encrypted and secure</p>
                </div>
              </div>
              <div className="flex items-start">
                <RiTimeLine className="text-blue-500 dark:text-blue-400 mt-1 mr-3" size={20} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Processing Time</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transfers are usually completed within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start">
                <RiLockLine className="text-purple-500 dark:text-purple-400 mt-1 mr-3" size={20} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Additional security layer for your transfers</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Account</h2>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                handleAddNewAccount()
              }} className="space-y-4">
                <div>
                  <label htmlFor="newAccountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="newAccountName"
                    value={newAccountData.name}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newAccountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RIB
                  </label>
                  <input
                    type="text"
                    id="newAccountNumber"
                    value={newAccountData.accountNumber}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Enter RIB"
                    required
                  />
                </div>

                <div className="pt-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full btn-primary py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Save Account
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-green-500 dark:bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center"
          >
            <RiCheckLine className="mr-2" size={24} />
            <span>Transfer initiated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Funds Success Message */}
      <AnimatePresence>
        {showMoveFunds && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-blue-500 dark:bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center"
          >
            <RiExchangeLine className="mr-2" size={24} />
            <span>Funds moved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BankTransfer 
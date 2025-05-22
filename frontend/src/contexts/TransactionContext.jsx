import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../lib/axios'
import { useTranslation } from 'react-i18next'

const TransactionContext = createContext()

export const useTransactions = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  return context
}

export const TransactionProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (currentUser?._id) {
      console.log('User authenticated, fetching transactions...')
      fetchTransactions()
    } else {
      console.log('No user found, skipping transaction fetch')
      setLoading(false)
    }
  }, [currentUser])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      console.log('Making API request to /api/transactions')
      const { data } = await api.get(`/api/transactions?userId=${currentUser._id}`)
      console.log('Received transactions:', data)
      setTransactions(data.transactions || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching transactions:', error.response?.data || error.message)
      setError(error.response?.data?.message || t('transactions.errors.fetchFailed'))
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTransactions = (filters) => {
    return transactions.filter(transaction => {
      // Filter by userId
      if (filters.userId && transaction.userId !== filters.userId) {
        return false;
      }

      // Filter by type
      if (filters.type && transaction.type !== filters.type) {
        return false
      }

      // Filter by subtype
      if (filters.subtype && transaction.subtype !== filters.subtype) {
        return false
      }

      // Filter by date range
      if (filters.startDate && new Date(transaction.createdAt) < new Date(filters.startDate)) {
        return false
      }
      if (filters.endDate && new Date(transaction.createdAt) > new Date(filters.endDate)) {
        return false
      }

      // Filter by amount range
      if (filters.minAmount && Math.abs(transaction.amount) < parseFloat(filters.minAmount)) {
        return false
      }
      if (filters.maxAmount && Math.abs(transaction.amount) > parseFloat(filters.maxAmount)) {
        return false
      }

      return true
    })
  }

  const createTransfer = async (transferData) => {
    try {
      const { data } = await api.post('/api/transactions/transfer', {
        ...transferData,
        userId: currentUser._id
      })
      setTransactions(prev => [data.transaction, ...prev])
      return data
    } catch (error) {
      console.error('Transfer error:', error.response?.data || error.message)
      throw error
    }
  }

  const createBankTransfer = async (transferData) => {
    try {
      const { data } = await api.post('/api/transactions/bank-transfer', {
        ...transferData,
        userId: currentUser._id
      })
      setTransactions(prev => [data.transaction, ...prev])
      return data
    } catch (error) {
      console.error('Bank transfer error:', error.response?.data || error.message)
      throw error
    }
  }

  const value = {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransfer,
    createBankTransfer,
    getFilteredTransactions
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

export default TransactionContext
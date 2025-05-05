import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const TransactionContext = createContext()

export function useTransactions() {
  return useContext(TransactionContext)
}

export function TransactionProvider({ children }) {
  const { currentUser } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [cryptoRate] = useState(0.25) // 1 DFLOW = 0.25 TND

  useEffect(() => {
    if (!currentUser) {
      setTransactions([])
      setLoading(false)
      return
    }

    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) throw new Error('Failed to fetch transactions')

        const data = await response.json()
        setTransactions(data.transactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [currentUser])

  async function transferTND(recipientEmail, amount, description) {
    try {
      const response = await fetch('/api/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientEmail,
          amount,
          description,
          currency: 'TND'
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setTransactions(prev => [data.transaction, ...prev])
      toast.success(`${amount} TND transferred successfully!`)
      return true
    } catch (error) {
      console.error('Transfer error:', error)
      toast.error(error.message)
      throw error
    }
  }

  async function buyCrypto(amount) {
    try {
      const response = await fetch('/api/transactions/crypto/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          tndAmount: amount * cryptoRate
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setTransactions(prev => [data.transaction, ...prev])
      toast.success(`Successfully bought ${amount} DFLOW`)
      return true
    } catch (error) {
      console.error('Buy crypto error:', error)
      toast.error(error.message)
      throw error
    }
  }

  async function sellCrypto(amount) {
    try {
      const response = await fetch('/api/transactions/crypto/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          tndAmount: amount * cryptoRate
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setTransactions(prev => [data.transaction, ...prev])
      toast.success(`Successfully sold ${amount} DFLOW`)
      return true
    } catch (error) {
      console.error('Sell crypto error:', error)
      toast.error(error.message)
      throw error
    }
  }

  async function transferCrypto(recipientEmail, amount, description) {
    try {
      const response = await fetch('/api/transactions/crypto/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientEmail,
          amount,
          description
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setTransactions(prev => [data.transaction, ...prev])
      toast.success(`${amount} DFLOW transferred successfully!`)
      return true
    } catch (error) {
      console.error('Transfer crypto error:', error)
      toast.error(error.message)
      throw error
    }
  }

  function getFilteredTransactions(filters = {}) {
    const { type, currency, startDate, endDate } = filters

    if (!transactions?.length) return []

    return transactions.filter(transaction => {
      if (!transaction) return false
      let matches = true

      if (type && transaction.type !== type) {
        matches = false
      }

      if (currency && transaction.currency !== currency) {
        matches = false
      }

      if (startDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt)
        if (transactionDate < new Date(startDate)) {
          matches = false
        }
      }

      if (endDate && transaction.createdAt) {
        const transactionDate = new Date(transaction.createdAt)
        if (transactionDate > new Date(endDate)) {
          matches = false
        }
      }

      return matches
    })
  }

  const value = {
    transactions,
    loading,
    transferTND,
    buyCrypto,
    sellCrypto,
    transferCrypto,
    getFilteredTransactions,
    cryptoRate
  }

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}
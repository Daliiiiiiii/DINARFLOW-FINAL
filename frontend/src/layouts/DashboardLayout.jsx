import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/navigation/Sidebar'
import Header from '../components/navigation/Header'
import LoadingScreen from '../components/ui/LoadingScreen'

const DashboardLayout = () => {
  const { loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header - fixed position */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
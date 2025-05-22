import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PropTypes from 'prop-types'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TransactionProvider } from './contexts/TransactionContext'
import PrivateRoute, { AdminRoute } from './components/auth/PrivateRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import EmailVerification from './components/auth/EmailVerification'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'
import LoadingSpinner from './assets/animations/LoadingSpinner'
import Support from './pages/Support'
import Admin from './admin/Admin'
import AdminUsers from './admin/Users'
import AdminSupport from './admin/Support'
import AdminSettings from './admin/Settings'
import AdminKYC from './admin/KYC'
import UserProfile from './admin/UserProfile'
import P2P from './pages/P2P'
import Notifications from './pages/Notifications'
import CryptoWallet from './pages/CryptoWallet'
import P2PProfile from './pages/P2PProfile'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Wallet from './pages/Wallet'
import Transfer from './pages/Transfer'
import History from './pages/History'
import BankTransfer from './pages/BankTransfer'

const AppContent = () => {
  const { currentUser, loading } = useAuth()
  const { i18n } = useTranslation()
  const [appReady, setAppReady] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(true)
  const location = useLocation()

  // Handle language change
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en'
    i18n.changeLanguage(savedLanguage)
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = savedLanguage
  }, [])

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = lng
    }

    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  useEffect(() => {
    // Simulate app initialization time to prevent flashing screens
    if (!loading) {
      const timer = setTimeout(() => {
        setAppReady(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [loading])

  useEffect(() => {
    // Simulate notification system initialization
    const timer = setTimeout(() => {
      setNotificationLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading || !appReady || notificationLoading) {
    return <LoadingSpinner />
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }
    return children
  }

  ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired
  }

  // Auth route component (redirects to dashboard if already logged in)
  const AuthRoute = ({ children }) => {
    if (currentUser) {
      return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
    }
    return children
  }

  AuthRoute.propTypes = {
    children: PropTypes.node.isRequired
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing Page */}
          <Route index element={<Landing />} />
          <Route path="landing" element={<Landing />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route 
              path="login" 
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              } 
            />
            <Route 
              path="register" 
              element={
                <AuthRoute>
                  <Register />
                </AuthRoute>
              } 
            />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Standalone verify-email route (no AuthLayout) */}
          <Route path="verify-email" element={<EmailVerification />} />
          <Route path="reset-password" element={<ForgotPassword />} />

          {/* Dashboard Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<Support />} />
            <Route path="bank-transfer" element={<BankTransfer />} />
            <Route path="p2p" element={<P2P />} />
            <Route path="p2p/:userId" element={<P2PProfile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="crypto-wallet" element={<CryptoWallet />} />
          </Route>

          {/* Admin Routes - Separated from Dashboard Routes */}
          <Route 
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route path="admin" element={<Admin />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/users/:id" element={<UserProfile />} />
            <Route path="admin/support" element={<AdminSupport />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/kyc" element={<AdminKYC />} />
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={i18n.language === 'ar'}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <TransactionProvider>
            <AppContent />
          </TransactionProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
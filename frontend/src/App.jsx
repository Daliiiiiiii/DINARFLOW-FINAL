import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import PropTypes from 'prop-types'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import PrivateRoute from './components/auth/PrivateRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import EmailVerification from './components/auth/EmailVerification'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Wallet from './pages/Wallet'
import Transfer from './pages/Transfer'
import Crypto from './pages/Crypto'
import History from './pages/History'
import AdminDashboard from './pages/AdminDashboard'
import BankTransfer from './pages/BankTransfer'

// Components
import LoadingScreen from './components/ui/LoadingScreen'

const AppContent = () => {
  const { currentUser, loading } = useAuth()
  const [appReady, setAppReady] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(true)
  const location = useLocation()

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
    return <LoadingScreen />
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
      return <Navigate to="/dashboard" replace />
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
              <Route 
                path="verify-email" 
                element={<EmailVerification />} 
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

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
              <Route path="crypto" element={<Crypto />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="bank-transfer" element={<BankTransfer />} />
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
        rtl={false}
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
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
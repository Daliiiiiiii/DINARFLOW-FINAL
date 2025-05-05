import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/ui/Logo'

const AuthLayout = () => {
  const location = useLocation()
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing'

  return (
    <div className={`min-h-screen flex flex-col ${isLandingPage ? 'bg-transparent p-0' : 'bg-gradient-to-br from-primary-50 to-secondary-50'}`}>
      {!isLandingPage && (
        <header className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center sm:justify-start">
            <Logo />
          </div>
        </header>
      )}
      
      <main className={`flex-1 flex items-center justify-center ${isLandingPage ? '' : 'p-4 sm:p-6'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </main>
      
      {!isLandingPage && (
        <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <div>
            <p>&copy; {new Date().getFullYear()} DinarFlow. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default AuthLayout
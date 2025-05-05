import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/ui/Logo'

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col items-center justify-center p-4"
    >
      <div className="mb-8">
        <Logo size="large" />
      </div>
      
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/dashboard" 
          className="btn-primary inline-flex items-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </motion.div>
  )
}

export default NotFound
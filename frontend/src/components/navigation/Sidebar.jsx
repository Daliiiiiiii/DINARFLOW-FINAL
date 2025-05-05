import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  RiDashboardLine, 
  RiWalletLine, 
  RiExchangeDollarLine, 
  RiCoinsLine,
  RiHistoryLine,
  RiUser3Line,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiBankLine
} from 'react-icons/ri'
import Logo from '../ui/Logo'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = () => {
  const { logout, userProfile } = useAuth()
  
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <RiDashboardLine size={20} /> },
    { path: '/wallet', name: 'Wallet', icon: <RiWalletLine size={20} /> },
    { path: '/transfer', name: 'Transfer', icon: <RiExchangeDollarLine size={20} /> },
    { path: '/bank-transfer', name: 'Bank Transfer', icon: <RiBankLine size={20} /> },
    { path: '/crypto', name: 'Crypto', icon: <RiCoinsLine size={20} /> },
    { path: '/history', name: 'History', icon: <RiHistoryLine size={20} /> },
    { path: '/profile', name: 'Profile', icon: <RiUser3Line size={20} /> },
    { path: '/settings', name: 'Settings', icon: <RiSettings4Line size={20} /> },
  ]
  
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  return (
    <div className="h-full bg-white dark:bg-gray-800 shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <Logo />
      </div>
      
      {userProfile && (
        <div className="p-4 mb-2 text-center">
          <div className="mb-2 flex justify-center">
            {userProfile.profilePicture ? (
              <img 
                src={userProfile.profilePicture} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xl font-semibold shadow-md">
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">{userProfile.displayName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile.email}</p>
        </div>
      )}
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`mr-3 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
        >
          <span className="mr-3 text-gray-500 dark:text-gray-400">
            <RiLogoutBoxRLine size={20} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
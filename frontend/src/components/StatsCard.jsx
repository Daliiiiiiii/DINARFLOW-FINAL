import { motion } from 'framer-motion'
import Card from './ui/Card'

export const StatsCard = ({ 
  title, 
  value, 
  valuePrefix = '', 
  icon, 
  trend = null 
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    }
    return val
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline">
            {valuePrefix && (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
                {valuePrefix}
              </span>
            )}
            <motion.span 
              key={value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {formatValue(value)}
            </motion.span>
          </div>

          {trend && (
            <div className="flex items-center space-x-2">
              <span className={`flex items-center text-sm font-medium ${
                trend.isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.value}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatsCard 
import React from 'react'

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700',
    transparent: 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700'
  }

  return (
    <div className={`rounded-xl shadow-sm ${variants[variant]} transition-colors duration-200 ${className}`}>
      {children}
    </div>
  )
}

const Header = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

const Content = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = Header
Card.Content = Content

export default Card 
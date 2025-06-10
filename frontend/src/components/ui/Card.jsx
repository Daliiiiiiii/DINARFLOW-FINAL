import React from 'react'

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white dark:bg-gray-900/50 dark:backdrop-blur-sm border border-gray-100 dark:border-gray-800',
    transparent: 'bg-white dark:bg-gray-900/50 dark:backdrop-blur-sm border border-gray-100 dark:border-gray-800/50',
    gradient: 'bg-white dark:bg-gray-900/50 dark:backdrop-blur-sm border border-gray-100 dark:border-gray-800'
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
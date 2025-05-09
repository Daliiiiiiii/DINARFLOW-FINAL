import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TransactionProvider } from './contexts/TransactionContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { DarkModeProvider } from './contexts/DarkModeContext'
import App from './App'
import './index.css'
import './i18n/i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TransactionProvider>
          <NotificationProvider>
            <DarkModeProvider>
              <App />
            </DarkModeProvider>
          </NotificationProvider>
        </TransactionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
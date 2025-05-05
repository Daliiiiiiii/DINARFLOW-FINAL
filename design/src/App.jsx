import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/dashboard/Wallet';
import Transfer from './pages/dashboard/Transfer';
import BankTransfer from './pages/dashboard/BankTransfer';
import Crypto from './pages/dashboard/Crypto';
import History from './pages/dashboard/History';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/bank-transfer" element={<BankTransfer />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
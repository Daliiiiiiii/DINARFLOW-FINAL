import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const MaintenanceContext = createContext();

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

export function MaintenanceProvider({ children }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        // Create a new axios instance without auth headers for this request
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/settings/maintenance-mode`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch maintenance mode status');
        }
        
        const data = await response.json();
        setIsMaintenanceMode(data.isMaintenanceMode);
      } catch (error) {
        console.error('Failed to fetch maintenance mode status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  const toggleMaintenanceMode = async () => {
    try {
      const { data } = await api.put('/api/settings/maintenance-mode', {
        isMaintenanceMode: !isMaintenanceMode
      });
      setIsMaintenanceMode(data.isMaintenanceMode);
      return data.isMaintenanceMode;
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      throw error;
    }
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, toggleMaintenanceMode, loading }}>
      {children}
    </MaintenanceContext.Provider>
  );
} 
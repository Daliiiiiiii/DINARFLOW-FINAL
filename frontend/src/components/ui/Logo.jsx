import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Logo = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <a href="/" className="flex items-center space-x-2 text-xl font-bold">
      <div className="relative w-10 h-10">
        {/* Main circle with gradient */}
        <div className={`absolute inset-0 rounded-full ${
          isDark 
            ? 'bg-gradient-to-br from-red-600 to-red-700' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          {/* Crescent shape using pseudo-element */}
          <div className={`absolute inset-1 rounded-full transform translate-x-1 ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}></div>
          {/* Star symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CircleDollarSign className={`w-5 h-5 ${
              isDark ? 'text-red-500' : 'text-blue-500'
            }`} />
          </div>
        </div>
      </div>
      <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
        isDark 
          ? 'from-red-400 to-red-600' 
          : 'from-blue-400 to-blue-600'
      }`}>
        DinarFlow
      </span>
    </a>
  );
};

export default Logo;
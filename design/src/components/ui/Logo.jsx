import React from 'react';
import { CircleDollarSign } from 'lucide-react';

const Logo = () => {
  return (
    <a href="/" className="flex items-center space-x-2 text-xl font-bold">
      <div className="relative w-10 h-10">
        {/* Main circle with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-full">
          {/* Crescent shape using pseudo-element */}
          <div className="absolute inset-1 bg-gray-900 rounded-full transform translate-x-1"></div>
          {/* Star symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>
      <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
        DinarFlow
      </span>
    </a>
  );
};

export default Logo;
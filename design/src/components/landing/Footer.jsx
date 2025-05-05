import React from 'react';
import Logo from '../ui/Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-950 py-16 px-4 md:px-8 lg:px-12 border-t border-gray-800">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
          <div>
            <Logo />
            <p className="text-gray-400 mt-4 max-w-xs">
              The future of digital finance in Tunisia. Secure, fast, and reliable.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6 text-lg">Product</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors flex items-center">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6 text-lg">Company</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors flex items-center">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-6 text-lg">Legal</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors flex items-center">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} DinarFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
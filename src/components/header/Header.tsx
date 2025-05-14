import React from 'react';
import { Menu, Layers, Bell, Settings } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 mr-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} className="text-gray-300" />
        </button>
        <Logo />
        <h1 className="ml-3 text-xl font-semibold tracking-wide text-cyan-400">
          NEON <span className="text-sm font-normal text-pink-400">C4I Platform</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-1">
        <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Layers size={20} className="text-gray-300" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Bell size={20} className="text-gray-300" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Settings size={20} className="text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
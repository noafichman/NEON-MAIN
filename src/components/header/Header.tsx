import React from 'react';
import { Menu, Layers, Bell, Settings } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="h-12 bg-gray-900 flex items-center justify-between px-4 border-b border-gray-800">
      <div className="flex items-center">
        <Logo />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
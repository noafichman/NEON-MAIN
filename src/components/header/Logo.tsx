import React from 'react';
import logo from '../../assets/lll.png';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img 
        src={logo} 
        alt="NEON Logo" 
        className="h-10 w-auto object-contain"
        style={{ maxWidth: 220 }}
      />
    </div>
  );
};

export default Logo;
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img 
        src="https://i.ibb.co/p2vG38Y/neon-logo.png" 
        alt="NEON Logo" 
        className="h-8 w-8 object-contain"
      />
    </div>
  );
};

export default Logo;
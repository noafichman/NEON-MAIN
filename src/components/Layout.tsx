import React, { ReactNode, useState } from 'react';
import Header from './header/Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100">
      <Header onMenuClick={() => setIsPanelVisible(!isPanelVisible)} />
      <main className="flex-1 overflow-hidden">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { isPanelVisible, setIsPanelVisible });
          }
          return child;
        })}
      </main>
    </div>
  );
};

export default Layout;
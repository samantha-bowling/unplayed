
import React from 'react';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';

interface FullScreenLayoutProps {
  children: React.ReactNode;
}

/**
 * Full screen layout
 * Designed for immersive experiences like the game picker
 */
const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({ children }) => {
  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen relative">
        <div className="fixed top-4 right-4 z-50 opacity-25 hover:opacity-100 transition-opacity">
          <FullScreenModeToggle />
        </div>
        
        <div className="min-h-screen flex items-center justify-center">
          {children}
        </div>
      </div>
    </FullScreenModeWrapper>
  );
};

export default FullScreenLayout;

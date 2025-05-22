
import React from 'react';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';

interface ZenLayoutProps {
  children: React.ReactNode;
}

/**
 * ZenLayout for distraction-free, immersive views
 * Used for full-screen component displays like library zen mode
 */
const ZenLayout: React.FC<ZenLayoutProps> = ({ children }) => {
  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex items-center justify-center">
        {children}
        
        {/* Add Full Screen Mode toggle in the corner */}
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      </div>
    </FullScreenModeWrapper>
  );
};

export default ZenLayout;

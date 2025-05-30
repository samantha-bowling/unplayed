
import React from 'react';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { useFullScreenMode } from '@/context/FullScreenModeContext';

interface ZenLayoutProps {
  children: React.ReactNode;
}

/**
 * ZenLayout for distraction-free, immersive views
 * Used for full-screen component displays like library zen mode
 */
const ZenLayout: React.FC<ZenLayoutProps> = ({ children }) => {
  const { isFullScreenMode } = useFullScreenMode();

  if (isFullScreenMode) {
    // Full screen mode - take over entire viewport with solid black background
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black z-[9999] overflow-hidden">
        {children}
        
        {/* Full screen mode toggle button */}
        <div className="absolute top-4 right-4 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      </div>
    );
  }

  // Component-area zen mode - fill available space with dark overlay
  return (
    <FullScreenModeWrapper>
      <div className="relative w-full h-full bg-black/90 rounded-lg overflow-hidden">
        {children}
        
        {/* Show Full Screen Mode toggle when not in full screen mode */}
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      </div>
    </FullScreenModeWrapper>
  );
};

export default ZenLayout;

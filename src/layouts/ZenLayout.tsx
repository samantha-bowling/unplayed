
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

  return (
    <FullScreenModeWrapper>
      <div className={`w-screen h-screen fixed inset-0 ${isFullScreenMode ? 'bg-black/95' : 'bg-black/80'}`}>
        {children}
        
        {/* Only show Full Screen Mode toggle when not in full screen mode */}
        {!isFullScreenMode && (
          <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
            <FullScreenModeToggle />
          </div>
        )}
      </div>
    </FullScreenModeWrapper>
  );
};

export default ZenLayout;

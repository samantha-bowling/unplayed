
import React, { useEffect } from 'react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { cn } from '@/lib/utils';

interface FullScreenModeWrapperProps {
  children: React.ReactNode;
}

const FullScreenModeWrapper: React.FC<FullScreenModeWrapperProps> = ({ children }) => {
  const { isFullScreenMode } = useFullScreenMode();

  // Apply body class for global styling when in full screen mode
  useEffect(() => {
    if (isFullScreenMode) {
      document.body.classList.add('fullscreen-mode');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
    return () => {
      document.body.classList.remove('fullscreen-mode');
    };
  }, [isFullScreenMode]);

  return (
    <div className={cn(
      'transition-all duration-500 ease-in-out',
      isFullScreenMode ? 'fullscreen-mode-container' : ''
    )}>
      {children}
    </div>
  );
};

export default FullScreenModeWrapper;

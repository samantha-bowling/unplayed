
import React, { useEffect } from 'react';
import { useZenMode } from '@/context/ZenModeContext';
import { cn } from '@/lib/utils';

interface ZenModeWrapperProps {
  children: React.ReactNode;
}

const ZenModeWrapper: React.FC<ZenModeWrapperProps> = ({ children }) => {
  const { isZenMode } = useZenMode();

  // Apply body class for global styling when in zen mode
  useEffect(() => {
    if (isZenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    return () => {
      document.body.classList.remove('zen-mode');
    };
  }, [isZenMode]);

  return (
    <div className={cn(
      'transition-all duration-300 ease-in-out',
      isZenMode && 'zen-mode-container'
    )}>
      {children}
    </div>
  );
};

export default ZenModeWrapper;

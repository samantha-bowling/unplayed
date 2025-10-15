
import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';

export interface WithDemoProps {
  isDemo?: boolean;
}

export function withDemoIndicator<T extends WithDemoProps>(
  Component: React.ComponentType<T>
) {
  return (props: Omit<T, 'isDemo'>) => {
    const { isDemo } = useDemoMode();
    const { isFullScreenMode } = useFullScreenMode();
    
    return (
      <div className="relative">
        <Component {...(props as T)} isDemo={isDemo && !isFullScreenMode} />
      </div>
    );
  };
}


import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';

export interface WithDemoProps {
  isDemo?: boolean;
}

export function withDemoIndicator<T extends WithDemoProps>(
  Component: React.ComponentType<T>
) {
  return (props: Omit<T, 'isDemo'>) => {
    const { isDemo } = useDemoMode();
    
    return (
      <div className="relative">
        <Component {...(props as T)} isDemo={isDemo} />
      </div>
    );
  };
}

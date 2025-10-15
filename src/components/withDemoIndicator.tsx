
import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';

export interface WithDemoProps {
  isDemo?: boolean;
}

export function withDemoIndicator<T extends WithDemoProps>(
  Component: React.ComponentType<T>
) {
  const WrappedComponent = (props: Omit<T, 'isDemo'>) => {
    const { isDemo } = useDemoMode();
    const { isFullScreenMode } = useFullScreenMode();
    
    // Memoize combined props to preserve reference stability
    // Only recreate when actual values change, not on every parent render
    const combinedProps = React.useMemo(
      () => ({
        ...props,
        isDemo: isDemo && !isFullScreenMode,
      } as T),
      // Dependencies: only the values that affect the combined props
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isDemo, isFullScreenMode, ...Object.values(props)]
    );
    
    return (
      <div className="relative">
        <Component {...combinedProps} />
      </div>
    );
  };
  
  // Add display name for React DevTools debugging
  WrappedComponent.displayName = `withDemoIndicator(${
    Component.displayName || Component.name || 'Component'
  })`;
  
  // Memoize the wrapper itself to prevent unnecessary re-renders
  return React.memo(WrappedComponent);
}

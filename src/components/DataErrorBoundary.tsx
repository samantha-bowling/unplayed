
import React, { ReactNode } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { EnhancedErrorBoundary } from './enhanced-error-boundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  component?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Data-specific error boundary that provides different fallback behavior for demo vs live modes
 * Now uses the enhanced error boundary with retry mechanisms
 */
export const DataErrorBoundary: React.FC<Props> = ({ 
  children, 
  fallback, 
  component,
  onRetry,
  showRetry = true 
}) => {
  const { isDemo } = useDemoMode();
  
  return (
    <EnhancedErrorBoundary 
      isDemo={isDemo} 
      fallback={fallback} 
      component={component}
      onRetry={onRetry}
      showRetry={showRetry}
      retryLimit={3}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

export default DataErrorBoundary;

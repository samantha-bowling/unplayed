
import React, { Component, ReactNode } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { getUnplayedDataService } from '@/lib/data-service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  component?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary that provides different fallback behavior for demo vs live modes
 */
export class DataErrorBoundaryClass extends Component<Props & { isDemo: boolean }, State> {
  constructor(props: Props & { isDemo: boolean }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { component = 'Unknown', isDemo } = this.props;
    
    if (isDemo) {
      // For demo mode, log but don't show error to user
      console.log(`[DataErrorBoundary] Demo mode error in ${component}, providing fallback`);
    } else {
      // For live mode, log with more detail
      console.error(`[DataErrorBoundary] Live mode error in ${component}:`, error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, isDemo, component = 'component' } = this.props;
      
      if (isDemo) {
        // For demo mode, try to render children anyway or use minimal fallback
        return fallback || (
          <div className="text-center text-gray-500 p-4">
            <p>Demo data loading...</p>
          </div>
        );
      } else {
        // For live mode, show more detailed error state
        return fallback || (
          <div className="text-center text-gray-500 p-4">
            <p>Unable to load data. Please try refreshing.</p>
            <p className="text-sm mt-2">Component: {component}</p>
          </div>
        );
      }
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that injects demo mode context
 */
export const DataErrorBoundary: React.FC<Props> = ({ children, fallback, component }) => {
  const { isDemo } = useDemoMode();
  
  return (
    <DataErrorBoundaryClass isDemo={isDemo} fallback={fallback} component={component}>
      {children}
    </DataErrorBoundaryClass>
  );
};

export default DataErrorBoundary;

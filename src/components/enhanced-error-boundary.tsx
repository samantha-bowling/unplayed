
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  component?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  retryLimit?: number;
  isDemo?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  showDetails: boolean;
  isRetrying: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0, 
      showDetails: false,
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    const { component = 'Unknown', isDemo } = this.props;
    
    if (isDemo) {
      console.log(`[EnhancedErrorBoundary] Demo mode error in ${component}:`, error.message);
    } else {
      console.error(`[EnhancedErrorBoundary] Error in ${component}:`, error, errorInfo);
    }

    // Auto-retry for certain error types (up to 2 times)
    if (this.shouldAutoRetry(error) && this.state.retryCount < 2) {
      this.autoRetry();
    }
  }

  componentWillUnmount() {
    // Clean up any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  shouldAutoRetry = (error: Error): boolean => {
    const retryableErrors = [
      'ChunkLoadError',
      'NetworkError',
      'TimeoutError',
      'Failed to fetch'
    ];
    
    return retryableErrors.some(errorType => 
      error.name.includes(errorType) || error.message.includes(errorType)
    );
  };

  autoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000); // Exponential backoff, max 5s
    
    console.log(`[EnhancedErrorBoundary] Auto-retrying in ${delay}ms (attempt ${this.state.retryCount + 1})`);
    
    const timeout = setTimeout(() => {
      this.handleRetry(true);
    }, delay);
    
    this.retryTimeouts.push(timeout);
  };

  handleRetry = (isAutoRetry: boolean = false) => {
    const { onRetry, retryLimit = 3 } = this.props;
    
    if (this.state.retryCount >= retryLimit) {
      toast.error("Retry limit reached. Please refresh the page.");
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1 
    });

    if (!isAutoRetry) {
      toast.info("Retrying...", { description: "Attempting to recover from the error." });
    }

    // Reset error state after a brief delay
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        isRetrying: false
      });
      
      // Call custom retry logic if provided
      onRetry?.();
    }, 500);
  };

  getErrorCategory = (error: Error): { category: string; severity: 'low' | 'medium' | 'high' } => {
    if (error.name.includes('ChunkLoadError')) {
      return { category: 'Build/Deployment', severity: 'medium' };
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { category: 'Network', severity: 'medium' };
    }
    if (error.message.includes('Cannot read properties') || error.message.includes('is not a function')) {
      return { category: 'Data/Type', severity: 'high' };
    }
    if (error.message.includes('auth') || error.message.includes('permission')) {
      return { category: 'Authentication', severity: 'high' };
    }
    return { category: 'Application', severity: 'high' };
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback, component = 'component', showRetry = true, isDemo } = this.props;
      const { category, severity } = this.getErrorCategory(this.state.error);
      
      // For demo mode, provide more graceful fallback
      if (isDemo) {
        return fallback || (
          <div className="text-center text-gray-500 p-6 bg-black/20 rounded-lg border border-gray-800">
            <AlertCircle className="h-8 w-8 text-unplayed-amber mx-auto mb-3" />
            <p className="text-unplayed-amber font-semibold">Demo data temporarily unavailable</p>
            <p className="text-sm text-gray-400 mt-1">This is normal in demo mode</p>
          </div>
        );
      }

      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default enhanced error UI
      return (
        <div className="text-center p-6 bg-black/30 border border-red-900/30 rounded-lg max-w-lg mx-auto">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className={cn(
              "h-8 w-8 mr-2",
              severity === 'high' && "text-red-400",
              severity === 'medium' && "text-yellow-400",
              severity === 'low' && "text-blue-400"
            )} />
            <h3 className="text-lg font-semibold text-white">
              {category} Error
            </h3>
          </div>
          
          <p className="text-gray-300 mb-4">
            Something went wrong in the {component} component.
          </p>
          
          <div className="space-y-3">
            {showRetry && (
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => this.handleRetry()}
                  disabled={this.state.isRetrying}
                  className="bg-unplayed-mint text-black hover:bg-unplayed-mint/90"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", this.state.isRetrying && "animate-spin")} />
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            )}
            
            {this.state.retryCount > 0 && (
              <p className="text-xs text-gray-500">
                Retry attempts: {this.state.retryCount}/{this.props.retryLimit || 3}
              </p>
            )}
            
            {/* Error details toggle */}
            <button
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="flex items-center text-xs text-gray-400 hover:text-gray-300 mx-auto"
            >
              {this.state.showDetails ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
              {this.state.showDetails ? 'Hide' : 'Show'} technical details
            </button>
            
            {this.state.showDetails && (
              <div className="mt-3 p-3 bg-black/50 rounded text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                    <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for use in functional components
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = () => setError(null);
  const throwError = (error: Error) => setError(error);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { resetError, throwError };
};

export default EnhancedErrorBoundary;

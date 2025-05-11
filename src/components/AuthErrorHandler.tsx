
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AuthErrorHandlerProps {
  errorCode?: string;
  errorMessage?: string;
  errorId?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  errorCode,
  errorMessage,
  errorId,
  onRetry,
  showHomeButton = true,
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get URL params if not provided as props
  const params = new URLSearchParams(location.search);
  const code = errorCode || params.get('error_code') || 'unknown_error';
  const message = errorMessage || params.get('error_message') ? 
    decodeURIComponent(params.get('error_message') || '') : 
    'An unknown authentication error occurred';
  const id = errorId || params.get('error_id');
  
  const handleCopyErrorDetails = () => {
    const errorText = `
Error ID: ${id || 'Not available'}
Error Code: ${code}
Message: ${message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
`.trim();

    navigator.clipboard.writeText(errorText)
      .then(() => {
        toast({
          title: 'Error details copied',
          description: 'Error information copied to clipboard',
        });
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  };
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default behavior - redirect to auth page
      navigate('/auth');
    }
  };

  return (
    <div className={`bg-black/30 border border-red-900/30 rounded-md p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-red-900/20 flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-red-400 mb-1">Authentication Error</h3>
          
          <p className="text-sm text-gray-300 mb-3">{message}</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-xs bg-black/20 p-2 rounded">
              <span className="text-gray-400">Error code: {code}</span>
              {id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs hover:bg-gray-800"
                  onClick={handleCopyErrorDetails}
                >
                  Copy details
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                className="bg-unplayed-mint text-black hover:bg-unplayed-mint/80"
                onClick={handleRetry}
              >
                <RefreshCw className="mr-2 h-3 w-3" /> Try Again
              </Button>
              
              {showHomeButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorHandler;

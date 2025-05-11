
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from "@/components/Header";
import { useToast } from '@/hooks/use-toast';
import FullScreenModeWrapper from "@/components/FullScreenModeWrapper";

interface AuthError {
  code: string;
  message: string;
  details?: string;
  errorId?: string;
}

const LoginErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<AuthError | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    const errorCode = params.get('error_code');
    const errorMessage = params.get('error_message');
    const errorDetails = params.get('error_details');
    const errorId = params.get('error_id');
    
    if (errorCode) {
      setError({
        code: errorCode,
        message: errorMessage ? decodeURIComponent(errorMessage) : 'Unknown error',
        details: errorDetails ? decodeURIComponent(errorDetails) : undefined,
        errorId: errorId || undefined
      });
      
      // Log the error for monitoring
      console.error('Authentication error:', {
        code: errorCode,
        message: errorMessage ? decodeURIComponent(errorMessage) : 'Unknown error',
        errorId
      });
    }
  }, [location.search]);
  
  const handleCopyErrorInfo = () => {
    if (!error) return;
    
    const errorText = `
Error ID: ${error.errorId || 'Not available'}
Error Code: ${error.code}
Message: ${error.message}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();
    
    navigator.clipboard.writeText(errorText)
      .then(() => {
        toast({
          title: 'Error details copied',
          description: 'The error information has been copied to your clipboard.',
        });
      })
      .catch((err) => {
        console.error('Failed to copy error details:', err);
        toast({
          title: 'Copy failed',
          description: 'Could not copy error details to clipboard.',
          variant: 'destructive',
        });
      });
  };

  // Get help text based on error code
  const getHelpText = () => {
    if (!error) return null;
    
    switch (error.code) {
      case 'verification_failed':
        return (
          <>
            <h3 className="text-sm font-medium mb-2">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Try signing in again</li>
              <li>Make sure cookies are enabled in your browser</li>
              <li>Try using a different browser</li>
              <li>If the problem persists, Steam may be experiencing issues</li>
            </ul>
          </>
        );
        
      case 'missing_steam_id':
      case 'invalid_response':
        return (
          <>
            <h3 className="text-sm font-medium mb-2">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Make sure you're signed in to Steam before attempting authentication</li>
              <li>Try clearing your browser cookies and cache</li>
              <li>Check if Steam is experiencing any outages</li>
            </ul>
          </>
        );
        
      case 'auth_setup_error':
      case 'session_creation_error':
        return (
          <>
            <h3 className="text-sm font-medium mb-2">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Our authentication service may be experiencing temporary issues</li>
              <li>Please try again later</li>
              <li>If the problem persists, please contact support with the error ID</li>
            </ul>
          </>
        );
        
      default:
        return (
          <>
            <h3 className="text-sm font-medium mb-2">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Try signing in again</li>
              <li>Ensure you're logged into Steam</li>
              <li>Check your internet connection</li>
              <li>If the problem persists, please contact support with the error ID</li>
            </ul>
          </>
        );
    }
  };

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/40 border border-red-900/30 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 rounded-full bg-red-900/30 mr-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-400">Authentication Error</h1>
                <p className="text-gray-300 text-sm">There was a problem signing you in</p>
              </div>
            </div>
            
            {error ? (
              <>
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-200 mb-1">Error Type:</div>
                  <div className="text-sm p-2 bg-gray-800/50 rounded font-mono">{error.code}</div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-200 mb-1">Message:</div>
                  <div className="text-sm p-2 bg-gray-800/50 rounded">{error.message}</div>
                </div>
                
                {error.errorId && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-200 mb-1">Error ID:</div>
                    <div className="text-sm p-2 bg-gray-800/50 rounded font-mono flex justify-between items-center">
                      <span className="truncate">{error.errorId}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 ml-2" 
                        onClick={handleCopyErrorInfo}
                        title="Copy error details"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-800/30 rounded p-3 mb-6 border border-gray-700/50">
                  {getHelpText()}
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-gray-300">No error details available</p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button 
                className="w-full bg-unplayed-mint text-black hover:bg-unplayed-mint/80"
                onClick={() => navigate('/auth')}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-600"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FullScreenModeWrapper>
  );
};

export default LoginErrorPage;

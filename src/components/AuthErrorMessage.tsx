
import React from 'react';
import { motion } from 'framer-motion';
import { EnhancedAuthStatus, AuthError } from '@/context/AuthContext';
import { AlertCircle, ShieldAlert, ServerOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorMessageProps {
  errorType: EnhancedAuthStatus;
  error: AuthError | null;
  onRetry: () => void;
}

export const AuthErrorMessage = ({ errorType, error, onRetry }: AuthErrorMessageProps) => {
  // Map error types to friendly messages and icons
  const getErrorContent = () => {
    switch (errorType) {
      case EnhancedAuthStatus.PROFILE_ERROR:
        return {
          icon: <ServerOff className="h-5 w-5 text-unplayed-red" />,
          title: "Profile Data Unavailable",
          message: "We couldn't load your profile data. This could be due to network issues or Steam API limitations.",
          suggestions: [
            "Check your internet connection",
            "Verify your Steam profile privacy settings",
            "Try again in a few moments"
          ]
        };
      case EnhancedAuthStatus.TOKEN_REFRESH_ERROR:
        return {
          icon: <ShieldAlert className="h-5 w-5 text-unplayed-amber" />,
          title: "Session Expired",
          message: "Your authentication session has expired. Please sign in again for security reasons.",
          suggestions: [
            "Sign in again to continue",
            "This happens automatically after some time for security"
          ]
        };
      case EnhancedAuthStatus.AUTH_ERROR:
        return {
          icon: <AlertCircle className="h-5 w-5 text-unplayed-red" />,
          title: "Authentication Failed",
          message: error?.message || "There was a problem authenticating with Steam.",
          suggestions: [
            "Steam may be experiencing high traffic",
            "Your browser might be blocking third-party cookies",
            "Try using a different browser if the issue persists"
          ]
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-unplayed-red" />,
          title: "Unknown Error",
          message: "An unexpected error occurred.",
          suggestions: ["Please try again"]
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <motion.div
      className="auth-error-container bg-black/30 border border-unplayed-red/30 rounded-md overflow-hidden"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="rounded-full bg-black/40 p-2 mt-0.5">
            {errorContent.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-unplayed-red mb-1">{errorContent.title}</h3>
            <p className="text-xs text-gray-300 mb-3">{errorContent.message}</p>
            
            {errorContent.suggestions.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-gray-400 mb-1">Troubleshooting:</h4>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-0.5">
                  {errorContent.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={onRetry}
              variant="outline"
              className="flex items-center space-x-1 text-xs bg-unplayed-mint/20 hover:bg-unplayed-mint/30 text-unplayed-mint border-unplayed-mint/20"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthErrorMessage;


import React from 'react';
import { motion } from 'framer-motion';
import { AuthError } from '@/context/AuthContext';
import { EnhancedAuthStatus } from '@/utils/auth-compatibility';
import { AlertCircle, ShieldAlert, ServerOff, RefreshCw, Unlink, Wifi, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorMessageProps {
  errorType: EnhancedAuthStatus;
  error: AuthError | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const AuthErrorMessage = ({ errorType, error, onRetry, isRetrying = false }: AuthErrorMessageProps) => {
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
        // Enhanced error matching for Steam auth errors
        if (error?.code === 'invalid_response' || error?.code === 'verification_failed') {
          return {
            icon: <Globe className="h-5 w-5 text-unplayed-red" />,
            title: "Steam Authentication Failed",
            message: error?.message || "There was a problem authenticating with Steam.",
            suggestions: [
              "Try signing in again",
              "Make sure cookies are enabled in your browser",
              "Check your internet connection"
            ]
          };
        } else if (error?.code === 'callback_error' || error?.code === 'auth_setup_error') {
          return {
            icon: <Unlink className="h-5 w-5 text-unplayed-red" />,
            title: "Authentication Connection Error",
            message: error?.message || "There was a problem connecting to the authentication service.",
            suggestions: [
              "Steam servers may be experiencing issues",
              "Our authentication system may be temporarily unavailable",
              "Try again in a few moments"
            ]
          };
        } else {
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
        }
      case EnhancedAuthStatus.LIBRARY_ERROR:
        return {
          icon: <Wifi className="h-5 w-5 text-unplayed-amber" />,
          title: "Library Access Error",
          message: "We couldn't access your Steam game library. Please check your Steam privacy settings.",
          suggestions: [
            "Set your 'Game details' to public in Steam privacy settings", 
            "Make sure your profile visibility is set to public",
            "Try reauthorizing after updating your settings"
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
            
            {error?.code && (
              <div className="mb-3 p-2 rounded bg-black/20 border border-gray-800">
                <code className="text-xs text-gray-500">Error code: {error.code}</code>
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={onRetry}
              variant="outline"
              className="flex items-center space-x-1 text-xs bg-unplayed-mint/20 hover:bg-unplayed-mint/30 text-unplayed-mint border-unplayed-mint/20"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthErrorMessage;

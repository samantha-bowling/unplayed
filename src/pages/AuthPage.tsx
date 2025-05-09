
import { useState, useEffect } from 'react';
import { useAuth, AuthStatus, EnhancedAuthStatus } from '@/context/AuthContext';
import { useAuthSessionStatus } from '@/hooks/use-auth-session-status';
import { useLocation, useNavigate } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithSteam, authStatus, user, enhancedStatus: contextEnhancedStatus } = useAuth();
  const { hasError, retry, enhancedStatus } = useAuthSessionStatus();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the redirect path from location state or query params
  const from = 
    (location.state as { from?: { pathname: string } })?.from?.pathname || 
    new URLSearchParams(location.search).get('redirectTo') ||
    '/';

  useEffect(() => {
    // If user is already logged in, redirect to the intended page
    if (authStatus === AuthStatus.AUTHENTICATED && user) {
      navigate(from, { replace: true });
    }
  }, [authStatus, user, navigate, from]);

  const handleSteamLogin = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    try {
      setIsLoading(true);
      await signInWithSteam(from);
    } catch (error) {
      console.error('Error during Steam login:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Could not authenticate with Steam. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Get status message based on current auth state
  const getStatusMessage = () => {
    switch (enhancedStatus) {
      case EnhancedAuthStatus.SESSION_LOADING:
        return "Verifying your session...";
      case EnhancedAuthStatus.PROFILE_LOADING:
        return "Loading your profile...";
      case EnhancedAuthStatus.PROFILE_ERROR:
        return "We're having trouble loading your profile.";
      case EnhancedAuthStatus.AUTH_ERROR:
        return "Authentication failed. Please try again.";
      case EnhancedAuthStatus.TOKEN_REFRESH_ERROR:
        return "Your session expired. Please log in again.";
      default:
        return "Please log in to continue";
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          className="text-4xl font-space font-bold mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </motion.div>
        
        <motion.div 
          className="w-full max-w-md terminal-container"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h1 className="terminal-header text-2xl mb-6">Authentication Required</h1>
          
          {/* Status Indicator */}
          {enhancedStatus !== EnhancedAuthStatus.SESSION_NOT_FOUND && (
            <motion.div 
              className="auth-status-pill mb-4 p-2 rounded-full flex items-center justify-center space-x-2 text-sm bg-black/50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={enhancedStatus} // Force re-animation on status change
            >
              <div className={`h-2 w-2 rounded-full ${hasError ? 'bg-unplayed-red animate-pulse' : 'bg-unplayed-mint'}`} />
              <span>{getStatusMessage()}</span>
            </motion.div>
          )}
          
          <div className="space-y-6">
            <p className="text-gray-300 text-center">
              To access your Steam library data, please authenticate with your Steam account.
            </p>
            
            <div className="terminal-box p-4 mb-4 bg-gray-900 rounded-md">
              <p className="text-sm text-gray-400 font-mono">
                <span className="text-unplayed-mint">$</span> We need access to scan your Steam library and provide backlog insights. Your account security is safe - we only access your public game data.
              </p>
            </div>
            
            {/* Error Details Panel */}
            {hasError && (
              <motion.div
                className="auth-error-details mb-4 border border-unplayed-red rounded-md overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <details className="text-sm">
                  <summary className="p-3 cursor-pointer bg-unplayed-red/20 hover:bg-unplayed-red/30 transition-colors">
                    What went wrong?
                  </summary>
                  <div className="p-3 bg-black/30">
                    {enhancedStatus === EnhancedAuthStatus.PROFILE_ERROR && (
                      <>
                        <p className="mb-2">We couldn't load your Steam profile. This could be due to:</p>
                        <ul className="list-disc pl-5 mb-2">
                          <li>Network connectivity issues</li>
                          <li>Steam API availability</li>
                          <li>Your Steam profile privacy settings</li>
                        </ul>
                      </>
                    )}
                    
                    {enhancedStatus === EnhancedAuthStatus.TOKEN_REFRESH_ERROR && (
                      <p className="mb-2">Your authentication session has expired. Please sign in again.</p>
                    )}
                    
                    {enhancedStatus === EnhancedAuthStatus.AUTH_ERROR && (
                      <p className="mb-2">There was a problem authenticating with Steam.</p>
                    )}
                    
                    <button 
                      onClick={retry}
                      className="flex items-center space-x-1 text-xs bg-unplayed-mint/20 hover:bg-unplayed-mint/30 text-unplayed-mint px-3 py-1 rounded-sm mt-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Try Again</span>
                    </button>
                  </div>
                </details>
              </motion.div>
            )}
            
            <motion.button
              onClick={handleSteamLogin}
              disabled={isLoading || authStatus === AuthStatus.LOADING}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1b2838] hover:bg-[#2a3f5a] transition-colors rounded-md relative overflow-hidden group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Steam-styled loading animation */}
              {(isLoading || authStatus === AuthStatus.LOADING) ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-unplayed-mint" />
                  <span>Connecting to Steam...</span>
                </div>
              ) : (
                <>
                  <SteamIcon className="w-6 h-6" />
                  <span>Login with Steam</span>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-unplayed-mint group-hover:w-full transition-all duration-300"></div>
                </>
              )}
            </motion.button>
            
            <div className="text-xs text-gray-500 text-center">
              By logging in, you agree to our{' '}
              <a href="#" className="text-unplayed-mint hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-unplayed-mint hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AuthPage;

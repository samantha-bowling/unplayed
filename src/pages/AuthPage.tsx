
import { useState, useEffect } from 'react';
import { useAuth, AuthStatus, EnhancedAuthStatus } from '@/context/AuthContext';
import { useAuthSessionStatus } from '@/hooks/use-auth-session-status';
import { useLocation, useNavigate } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { signInWithSteam, authStatus, user, enhancedStatus: contextEnhancedStatus, profile } = useAuth();
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
    // If user is already logged in, show success animation then redirect
    if (authStatus === AuthStatus.AUTHENTICATED && user && !showSuccessAnimation) {
      setShowSuccessAnimation(true);
    }
  }, [authStatus, user, navigate, from, showSuccessAnimation]);

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

  // Get appropriate loading message based on auth state
  const getLoadingMessage = () => {
    switch (enhancedStatus) {
      case EnhancedAuthStatus.SESSION_LOADING:
        return "Connecting to Steam...";
      case EnhancedAuthStatus.PROFILE_LOADING:
        return "Loading your game library...";
      default:
        return "Processing...";
    }
  };

  // Handle success animation completion
  const handleSuccessAnimationComplete = () => {
    navigate(from, { replace: true });
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
              <span>{
                [EnhancedAuthStatus.SESSION_LOADING, EnhancedAuthStatus.PROFILE_LOADING].includes(enhancedStatus) ? 
                getLoadingMessage() : 
                enhancedStatus === EnhancedAuthStatus.PROFILE_LOADED ? 
                "Profile loaded successfully" : 
                hasError ? "Authentication error" : "Please log in to continue"
              }</span>
            </motion.div>
          )}
          
          <div className="space-y-6">
            <AnimatePresence>
              {/* Show the Steam Loader during loading states */}
              {[EnhancedAuthStatus.SESSION_LOADING, EnhancedAuthStatus.PROFILE_LOADING].includes(enhancedStatus) && (
                <motion.div 
                  className="flex flex-col items-center justify-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key="steam-loader"
                >
                  <SteamLoader 
                    message={getLoadingMessage()}
                    size="lg"
                    variant="primary" 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!hasError && enhancedStatus === EnhancedAuthStatus.SESSION_NOT_FOUND && (
                <motion.div
                  key="auth-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-gray-300 text-center">
                    To access your Steam library data, please authenticate with your Steam account.
                  </p>
                  
                  <div className="terminal-box p-4 my-6 bg-gray-900 rounded-md">
                    <p className="text-sm text-gray-400 font-mono">
                      <span className="text-unplayed-mint">$</span> We need access to scan your Steam library and provide backlog insights. Your account security is safe - we only access your public game data.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error Details Panel */}
            <AnimatePresence>
              {hasError && (
                <motion.div
                  key="error-message"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AuthErrorMessage
                    errorType={enhancedStatus}
                    error={hasError ? { 
                      code: 'unknown', 
                      message: 'Unknown authentication error',
                      timestamp: Date.now() // Added the required timestamp property
                    } : null}
                    onRetry={retry}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {enhancedStatus === EnhancedAuthStatus.SESSION_NOT_FOUND && (
                <motion.button
                  onClick={handleSteamLogin}
                  disabled={isLoading || authStatus === AuthStatus.LOADING}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1b2838] hover:bg-[#2a3f5a] transition-colors rounded-md relative overflow-hidden group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="steam-button"
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
              )}
            </AnimatePresence>
            
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

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <AuthSuccessAnimation 
            username={profile?.steam_name || user?.user_metadata?.name}
            onComplete={handleSuccessAnimationComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuthPage;

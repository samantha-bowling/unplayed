
import { useState, useEffect } from 'react';
import { useAuth, AuthStatus, EnhancedAuthStatus } from '@/context/AuthContext';
import { useAuthSessionStatus } from '@/hooks/use-auth-session-status';
import { useLocation, useNavigate } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamPrivacyChecklist from '@/components/SteamPrivacyChecklist';
import SteamPrivacyError from '@/components/SteamPrivacyError';
import DemoModeFallback from '@/components/DemoModeFallback';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [libraryPrivacyError, setLibraryPrivacyError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { signInWithSteam, authStatus, user, enhancedStatus: contextEnhancedStatus, profile, refreshProfile } = useAuth();
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
    // Check for library privacy error based on user status and library sync status
    if (user && profile && enhancedStatus === EnhancedAuthStatus.PROFILE_LOADED && !showSuccessAnimation) {
      // If we have a user and profile, but no library data, it's likely a privacy issue
      if (profile.steam_id && !profile.last_sync) {
        console.log('Detected potential library privacy issue');
        setLibraryPrivacyError(true);
      } else {
        setLibraryPrivacyError(false);
        setShowSuccessAnimation(true);
      }
    }
  }, [user, profile, enhancedStatus, showSuccessAnimation]);

  // If user is already logged in, show success animation then redirect
  useEffect(() => {
    if (authStatus === AuthStatus.AUTHENTICATED && user && !showSuccessAnimation && !libraryPrivacyError) {
      setShowSuccessAnimation(true);
    }
  }, [authStatus, user, showSuccessAnimation, libraryPrivacyError]);

  // Check for auth errors in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error_code');
    const errorMessage = params.get('error_message');
    
    if (errorCode) {
      console.error('Authentication error:', errorCode, errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage || 'Failed to authenticate with Steam',
        variant: 'destructive',
      });
      
      // Clean up error params from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error_code');
      newUrl.searchParams.delete('error_message');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search, toast]);

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

  // Handle retry for privacy error
  const handleRetryLibraryAccess = async () => {
    setIsRetrying(true);
    try {
      await refreshProfile();
      // After refresh, check if we now have library data
      if (profile?.last_sync) {
        setLibraryPrivacyError(false);
        setShowSuccessAnimation(true);
        toast({
          title: 'Success!',
          description: 'We can now access your game library.',
        });
      } else {
        toast({
          title: 'Still Unable to Access Library',
          description: 'Please check your Steam privacy settings and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
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
              {/* Steam Privacy Error */}
              {libraryPrivacyError && (
                <motion.div
                  key="privacy-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SteamPrivacyError 
                    onRetry={handleRetryLibraryAccess} 
                    isLoading={isRetrying} 
                  />
                  <DemoModeFallback />
                </motion.div>
              )}
              
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
              {!hasError && enhancedStatus === EnhancedAuthStatus.SESSION_NOT_FOUND && !libraryPrivacyError && (
                <motion.div
                  key="auth-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SteamPrivacyChecklist />
                  
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
                      timestamp: Date.now()
                    } : null}
                    onRetry={retry}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {enhancedStatus === EnhancedAuthStatus.SESSION_NOT_FOUND && !libraryPrivacyError && (
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="steam-button"
                >
                  {isLoading || authStatus === AuthStatus.LOADING ? (
                    <div className="flex items-center space-x-2 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-unplayed-mint" />
                      <span>Connecting to Steam...</span>
                    </div>
                  ) : (
                    <SteamLoginButton redirectPath={from} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="text-xs text-gray-500 text-center">
              By logging in, you agree to our{' '}
              <a 
                href="#" 
                className="text-unplayed-mint hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Terms of Service clicked');
                  setTermsOfServiceOpen(true);
                }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="#" 
                className="text-unplayed-mint hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Privacy Policy clicked');
                  setPrivacyPolicyOpen(true);
                }}
              >
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
      
      {/* Dialog components */}
      <PrivacyPolicyDialog open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen} />
      <TermsOfServiceDialog open={termsOfServiceOpen} onOpenChange={setTermsOfServiceOpen} />
    </motion.div>
  );
};

export default AuthPage;

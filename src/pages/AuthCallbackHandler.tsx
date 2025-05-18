// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthSessionManager, { AuthFlowState } from '@/utils/auth/AuthSessionManager';

const AuthCallbackHandler = () => {
  const {
    refreshSession,
    refreshProfile,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('initializing');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    // Debug logging
    console.log('[AuthCallback] Current state:', {
      processingStep,
      loading,
      error: processingError,
      sessionChecked,
      retryAttempts,
      url: window.location.href,
      authFlowState: AuthSessionManager.getAuthFlowState()
    });
  }, [processingStep, loading, processingError, sessionChecked, retryAttempts]);

  useEffect(() => {
    // Set auth flow state to indicate we're in the callback phase
    AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_CALLBACK);
    
    // Set flags to indicate we're in the middle of an auth flow
    // These help prevent flickering in other components
    AuthSessionManager.setAuthFlag('AUTH_IN_PROGRESS', 'true');
    
    // Mark this as a fresh login to help with onboarding flow
    AuthSessionManager.markJustLoggedIn();
    
    // Mark that we're coming from auth callback - helps navigation decisions
    AuthSessionManager.markFromAuthCallback();
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 800; // ms
    
    const processAuth = async () => {
      try {
        setProcessingStep('checking_hash');
        console.log('[AuthCallback] Starting auth processing...');
        
        // Check for obvious error parameters in URL
        const queryParams = new URLSearchParams(window.location.search);
        const errorCode = queryParams.get('error_code');
        
        if (errorCode) {
          console.error(`[AuthCallback] Error code in URL: ${errorCode}`);
          const errorDesc = queryParams.get('error_description') || 'Unknown error';
          setProcessingError(`Authentication failed: ${errorDesc}`);
          // Update auth flow state to error
          AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
          // Remove the auth in progress flag
          AuthSessionManager.removeAuthFlag('AUTH_IN_PROGRESS');
          navigate(`/login-error?${queryParams.toString()}`);
          return;
        }

        const hasAuthHash = window.location.hash && 
          (window.location.hash.includes('access_token') || 
           window.location.hash.includes('error'));

        if (hasAuthHash) {
          console.log('[AuthCallback] Auth hash detected in URL');
        }

        setProcessingStep('refreshing_session');
        console.log('[AuthCallback] Refreshing session...');
        
        // First attempt with exponential backoff
        let session = null;
        let attemptCount = 0;
        
        while (!session && attemptCount < MAX_RETRIES) {
          try {
            if (attemptCount > 0) {
              console.log(`[AuthCallback] Retry attempt ${attemptCount + 1}/${MAX_RETRIES}`);
              // Wait longer between each retry attempt
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attemptCount)));
            }
            
            session = await refreshSession();
            attemptCount++;
            
            if (!session) {
              console.log(`[AuthCallback] No session found yet, will try manual extraction`);
              
              try {
                setProcessingStep('manual_session_extract');
                console.log('[AuthCallback] Attempting manual session extraction...');
                
                // Try to manually extract the session
                const { data, error } = await supabase.auth.getSession();
                
                if (error || !data.session) {
                  console.error('[AuthCallback] Manual extraction failed:', error || 'No session data');
                } else {
                  console.log('[AuthCallback] Manual session extraction succeeded');
                  session = data.session;
                  
                  // Wait briefly for session to be fully available
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              } catch (err) {
                console.error('[AuthCallback] Manual extraction error:', err);
              }
            }
          } catch (err) {
            console.error(`[AuthCallback] Session refresh error on attempt ${attemptCount + 1}:`, err);
          }
        }
        
        setSessionChecked(true);

        if (!session) {
          console.error('[AuthCallback] Unable to obtain session after multiple attempts');
          setProcessingError('Unable to complete authentication. Please try signing in again.');
          // Update auth flow state to error
          AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
          // Clear auth flags on error
          AuthSessionManager.removeAuthFlag('AUTH_IN_PROGRESS');
          navigate('/auth');
          return;
        }

        setProcessingStep('fetching_profile');
        console.log('[AuthCallback] Session confirmed. Fetching profile...');
        AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_SUCCESS);
        AuthSessionManager.setAuthFlowState(AuthFlowState.PROFILE_LOADING);
        
        // Try to get the profile with retries
        let profileData = null;
        let profileAttempts = 0;
        const MAX_PROFILE_RETRIES = 2;
        
        while (!profileData && profileAttempts < MAX_PROFILE_RETRIES) {
          try {
            if (profileAttempts > 0) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log(`[AuthCallback] Profile fetch retry ${profileAttempts + 1}/${MAX_PROFILE_RETRIES}`);
            }
            
            profileData = await refreshProfile();
            profileAttempts++;
          } catch (err) {
            console.error(`[AuthCallback] Profile fetch error on attempt ${profileAttempts}:`, err);
          }
        }
        
        console.log('[AuthCallback] Profile data:', profileData);
        AuthSessionManager.setAuthFlowState(AuthFlowState.PROFILE_LOADED);
        
        if (!profileData) {
          console.log('[AuthCallback] No profile found, needs onboarding');
          AuthSessionManager.setAuthFlowState(AuthFlowState.ONBOARDING_NEEDED);
          navigate('/welcome');
        } else if (profileData.onboarding_complete !== true) {
          console.log('[AuthCallback] Profile found but onboarding not complete');
          AuthSessionManager.setAuthFlowState(AuthFlowState.ONBOARDING_NEEDED);
          navigate('/welcome');
        } else {
          console.log('[AuthCallback] Onboarding complete, navigating to library');
          AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_READY);
          // User is fully authenticated and onboarded
          toast.success('Welcome back!');
          navigate('/library');
        }
      } catch (err: any) {
        console.error('[AuthCallbackHandler] Fatal auth error:', err);
        setProcessingError(`Authentication failed: ${err.message}`);
        AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
        AuthSessionManager.clearAllAuthFlags();
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    processAuth();
    
    // Cleanup function to ensure we don't leave flags set if component unmounts
    return () => {
      // Only clear the 'authInProgress' flag - keep 'justLoggedIn' for the Welcome page
      AuthSessionManager.removeAuthFlag('AUTH_IN_PROGRESS');
    };
  }, [refreshSession, refreshProfile, navigate]);

  if (processingError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <AuthErrorHandler 
          errorMessage={processingError} 
          errorCode="auth_callback_failed"
          onRetry={() => navigate('/auth')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <SteamLoader 
        message={`Processing authentication... (${processingStep})`} 
        size="md" 
        variant="secondary" 
      />
      <p className="text-sm text-muted-foreground mt-8">
        If you're not redirected within a few seconds, 
        <button 
          onClick={() => navigate('/auth')} 
          className="underline ml-1 hover:text-primary"
        >
          click here
        </button>
      </p>
      <div className="text-xs text-gray-500 mt-2">
        Attempt: {retryAttempts + 1}
      </div>
    </div>
  );
};

export default AuthCallbackHandler;

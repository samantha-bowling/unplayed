
// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { supabase } from '@/integrations/supabase/client';

const AuthCallbackHandler = () => {
  const {
    user,
    refreshSession,
    refreshProfile,
    lastError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('initializing');

  useEffect(() => {
    const processAuth = async () => {
      try {
        setProcessingStep('checking_hash');
        console.log('[AuthCallback] Starting auth processing...');
        
        // Check if we're on an auth hash URL
        const hasAuthHash = window.location.hash && 
          (window.location.hash.includes('access_token') || 
           window.location.hash.includes('error'));
        
        if (hasAuthHash) {
          console.log('[AuthCallback] Auth hash detected in URL');
        }
        
        // First ensure we have a session regardless of whether user is populated yet
        setProcessingStep('refreshing_session');
        const session = await refreshSession();
        
        if (!session) { // Fixed: check session object, not truthiness of void
          console.warn('[AuthCallback] No session found after refresh');
          const queryParams = new URLSearchParams(window.location.search);
          const errorCode = queryParams.get('error_code');
          
          if (errorCode) {
            console.error(`[AuthCallback] Error code found in URL: ${errorCode}`);
            setProcessingError(`Authentication failed: ${queryParams.get('error_description') || 'Unknown error'}`);
            // If there's an error code in the URL, redirect to login error page
            navigate(`/login-error?${queryParams.toString()}`);
            return;
          }
          
          // No session and no error in URL - try manual session extraction
          try {
            setProcessingStep('manual_session_extract');
            // Use Supabase to explicitly handle the redirect
            console.log('[AuthCallback] Attempting to extract session from URL...');
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              throw new Error(`Session extraction failed: ${error.message}`);
            }
            
            if (!data.session) {
              navigate('/auth');
              return;
            }
          } catch (err: any) {
            console.error('[AuthCallback] Manual session extraction failed:', err);
            setProcessingError(`Failed to process authentication: ${err.message}`);
            navigate('/auth');
            return;
          }
        }
        
        // Now we have a session, let's get the profile
        setProcessingStep('fetching_profile');
        console.log('[AuthCallback] Successfully got session, fetching profile...');
        const profileData = await refreshProfile();
        
        // Determine where to navigate based on onboarding status
        if (profileData?.onboarding_complete) {
          console.log('[AuthCallback] Onboarding complete, navigating to library');
          navigate('/library');
        } else {
          console.log('[AuthCallback] Onboarding incomplete, navigating to welcome');
          navigate('/welcome');
        }
      } catch (err: any) {
        console.error('[AuthCallbackHandler] Error during auth processing:', err);
        setProcessingError(`Authentication failed: ${err.message}`);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    // Start the auth processing immediately without waiting for user
    processAuth();
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
    </div>
  );
};

export default AuthCallbackHandler;

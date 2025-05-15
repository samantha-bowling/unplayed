// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const processAuth = async () => {
      try {
        setProcessingStep('checking_hash');
        console.log('[AuthCallback] Starting auth processing...');

        const hasAuthHash = window.location.hash &&
          (window.location.hash.includes('access_token') ||
           window.location.hash.includes('error'));

        if (hasAuthHash) {
          console.log('[AuthCallback] Auth hash detected in URL');
        }

        setProcessingStep('refreshing_session');
        const session = await refreshSession();

        if (!session) {
          console.warn('[AuthCallback] No session found after refresh');
          const queryParams = new URLSearchParams(window.location.search);
          const errorCode = queryParams.get('error_code');

          if (errorCode) {
            console.error(`[AuthCallback] Error code in URL: ${errorCode}`);
            setProcessingError(`Authentication failed: ${queryParams.get('error_description') || 'Unknown error'}`);
            navigate(`/login-error?${queryParams.toString()}`);
            return;
          }

          try {
            setProcessingStep('manual_session_extract');
            console.log('[AuthCallback] Attempting manual session extraction...');
            const { data, error } = await supabase.auth.getSessionFromUrl();
            if (error || !data.session) {
              throw new Error(error?.message || 'No session found');
            }
          } catch (err: any) {
            console.error('[AuthCallback] Manual session extraction failed:', err);
            setProcessingError(`Failed to process authentication: ${err.message}`);
            navigate('/auth');
            return;
          }
        }

        setProcessingStep('fetching_profile');
        console.log('[AuthCallback] Session confirmed. Fetching profile...');
        const profileData = await refreshProfile();

        if (profileData?.onboarding_complete) {
          console.log('[AuthCallback] Onboarding complete, navigating to library');
          navigate('/library');
        } else {
          console.log('[AuthCallback] Onboarding incomplete, navigating to welcome');
          navigate('/welcome');
        }
      } catch (err: any) {
        console.error('[AuthCallbackHandler] Fatal auth error:', err);
        setProcessingError(`Authentication failed: ${err.message}`);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

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

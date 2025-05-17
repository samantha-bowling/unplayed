
// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      url: window.location.href
    });
  }, [processingStep, loading, processingError, sessionChecked, retryAttempts]);

  useEffect(() => {
    const MAX_RETRIES = 3;
    
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
        const session = await refreshSession();
        setSessionChecked(true);

        if (!session && retryAttempts < MAX_RETRIES) {
          console.warn(`[AuthCallback] No session found after refresh. Retry attempt ${retryAttempts + 1}`);
          
          // Only try manual extraction on the first attempt
          if (retryAttempts === 0) {
            try {
              setProcessingStep('manual_session_extract');
              console.log('[AuthCallback] Attempting manual session extraction...');
              
              // Fixed: Using the correct Supabase method
              const { data, error } = await supabase.auth.getSession();
              
              if (error || !data.session) {
                throw new Error(error?.message || 'No session found');
              }
              
              console.log('[AuthCallback] Manual session extraction succeeded');
              // Wait briefly for session to be available
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (err: any) {
              console.error('[AuthCallback] Manual session extraction failed:', err);
              setRetryAttempts(prev => prev + 1);
              return; // Exit this attempt, useEffect will try again
            }
          } else {
            // Just wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            setRetryAttempts(prev => prev + 1);
            return; // Exit this attempt, useEffect will try again
          }
        }
        
        if (!session && retryAttempts >= MAX_RETRIES) {
          console.error('[AuthCallback] Max retries reached. Unable to obtain session.');
          setProcessingError('Unable to complete authentication after several attempts');
          navigate('/auth');
          return;
        }

        setProcessingStep('fetching_profile');
        console.log('[AuthCallback] Session confirmed. Fetching profile...');
        const profileData = await refreshProfile();

        if (profileData?.onboarding_complete) {
          console.log('[AuthCallback] Onboarding complete, navigating to library');
          toast.success('Welcome back!');
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
  }, [refreshSession, refreshProfile, navigate, retryAttempts]);

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

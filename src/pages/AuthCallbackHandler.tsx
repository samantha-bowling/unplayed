
// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import { AuthStorage } from '@/utils/auth-service';
import AuthErrorHandler from '@/components/AuthErrorHandler';

/**
 * Handles callbacks from general authentication providers (Discord, Twitch, Email).
 * This component is separate from SteamAuthHandler which handles Steam-specific flows.
 */
const AuthCallbackHandler = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  // Handle general auth callback
  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Mark that we're handling an auth callback
        AuthStorage.markFromAuthCallback();
        
        // Check if there's an error in the URL parameters
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        if (errorCode) {
          console.error(`[AuthCallback] Error in URL: ${errorCode} - ${errorDescription}`);
          setErrorCode(errorCode);
          setError(errorDescription || 'Unknown authentication error');
          setProcessing(false);
          return;
        }
        
        // Get redirect destination if specified
        const redirectTo = AuthStorage.getRedirectPath() || '/';
        
        // If user exists, get their profile
        if (user) {
          // Mark successful login
          AuthStorage.markJustLoggedIn();
          
          // Force a profile refresh to get the latest data
          const profile = await refreshProfile(true);
          
          if (profile?.steam_id) {
            // User has Steam linked, go to their library
            navigate('/library');
          } else {
            // User authenticated but needs to link Steam - send to home
            navigate('/');
          }
        } else {
          // If no user by this point, send to auth page
          navigate('/auth');
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error processing callback:', err);
        setErrorCode('auth_processing_error');
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    processAuthCallback();
  }, [user, refreshProfile, navigate, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AuthErrorHandler 
          errorCode={errorCode || 'auth_callback_error'} 
          errorMessage={error}
          onRetry={() => navigate('/auth')}
          showHomeButton={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <SteamLoader 
        message="Processing authentication..." 
        size="md" 
        variant="secondary" 
      />
    </div>
  );
};

export default AuthCallbackHandler;

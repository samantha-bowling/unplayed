
// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import { AuthStorage } from '@/utils/auth-service';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Handles callbacks from general authentication providers (Discord, Twitch, Email).
 * This component is separate from SteamAuthHandler which handles Steam-specific flows.
 */
const AuthCallbackHandler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const queryClient = useQueryClient();

  // Handle general auth callback
  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback');
        
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
        
        // If user exists, proceed with authentication flow
        if (user) {
          console.log('[AuthCallback] User is authenticated, id:', user.id);
          
          // Mark successful login
          AuthStorage.markJustLoggedIn();
          
          // Force a profile refresh by invalidating the React Query cache
          if (user.id) {
            queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          }
          
          // Wait a moment to ensure profile data is loaded before navigating
          setTimeout(() => {
            // Get the profile data from the React Query cache
            const profileData = queryClient.getQueryData(['profile', user.id]);
            
            if (profileData && (profileData as any).steam_id) {
              // User has Steam linked, go to their library
              navigate('/library');
            } else {
              // User authenticated but needs to link Steam
              navigate('/');
            }
          }, 500);
        } else {
          console.log('[AuthCallback] No user found, redirecting to auth page');
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
  }, [user, navigate, searchParams, queryClient]);

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

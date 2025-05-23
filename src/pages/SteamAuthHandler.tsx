
// src/pages/SteamAuthHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import { toast } from 'sonner';
import { callUpsertUser } from '@/utils/auth/callUpsertUser';
import { AuthStorage } from '@/utils/auth-service';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Dedicated component for handling Steam account linking.
 * This component processes callbacks from the Steam authentication process.
 */
const SteamAuthHandler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const queryClient = useQueryClient();

  // Parse Steam parameters
  const steam_id = searchParams.get('steam_id');
  const steam_name = searchParams.get('steam_name');
  const steam_avatar = searchParams.get('steam_avatar');
  const uid = searchParams.get('uid');

  // Log current URL and params for debugging
  useEffect(() => {
    console.log('[SteamAuth] SteamAuthHandler mounted');
    console.log('[SteamAuth] Current URL:', window.location.href);
    console.log('[SteamAuth] Search params:', Object.fromEntries(searchParams.entries()));
  }, [searchParams]);

  useEffect(() => {
    const processSteamAuth = async () => {
      try {
        console.log('[SteamAuth] Processing Steam auth callback');
        console.log('[SteamAuth] URL params:', {
          steam_id,
          steam_name,
          steam_avatar,
          uid
        });
        console.log('[SteamAuth] Current user:', user);
        
        // Validate required parameters
        if (!steam_id || !steam_name || !uid) {
          console.error('[SteamAuth] Missing required Steam parameters:', {
            steam_id,
            steam_name,
            uid
          });
          setErrorCode('missing_parameters');
          setError('Missing required Steam account information. Please try linking your Steam account again.');
          setProcessing(false);
          return;
        }

        // Ensure UID matches current user
        if (user?.id !== uid) {
          console.error('[SteamAuth] UID mismatch. Expected:', user?.id, 'Got:', uid);
          setErrorCode('user_mismatch');
          setError('User ID mismatch. Please try linking your Steam account again.');
          setProcessing(false);
          return;
        }
        
        // Mark that we're handling an auth callback
        AuthStorage.markFromAuthCallback();
        
        try {
          console.log('[SteamAuth] Updating user profile with Steam data');
          
          const decodedSteamName = steam_name ? decodeURIComponent(steam_name) : '';
          const decodedSteamAvatar = steam_avatar ? decodeURIComponent(steam_avatar) : undefined;
          
          // Log the exact payload we're sending to upsert-user
          const updatePayload = {
            id: uid,
            steam_id,
            steam_name: decodedSteamName,
            steam_avatar: decodedSteamAvatar,
            onboarding_complete: true,
          };
          
          console.log('[SteamAuth] Upsert user payload:', updatePayload);
          
          // Update user profile with Steam information
          const result = await callUpsertUser(updatePayload);
          
          console.log('[SteamAuth] Upsert successful, result:', result);
          
          // Invalidate profile cache to force refresh with new Steam data
          queryClient.invalidateQueries({ queryKey: ['profile', uid] });
          
          toast.success('Steam account linked successfully!');
          
          // Navigate to library after successful Steam linking
          navigate('/library');
        } catch (err: any) {
          console.error('[SteamAuth] Steam linking error:', err);
          
          // Enhanced error logging for debugging
          if (err.status) {
            console.error(`[SteamAuth] HTTP Status: ${err.status}`);
          }
          
          let errorMessage = err.message || 'Unknown error occurred while linking your Steam account';
          let errorCode = 'linking_failed';
          
          // Try to provide more meaningful error messages based on common issues
          if (errorMessage.includes('404')) {
            errorCode = 'api_not_found';
            errorMessage = 'The API endpoint for linking your Steam account could not be found. This may be due to a deployment issue.';
          } else if (errorMessage.includes('500')) {
            errorCode = 'server_error';
            errorMessage = 'The server encountered an error while linking your Steam account. Please try again later.';
          } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
            errorCode = 'network_error';
            errorMessage = 'A network error occurred while linking your Steam account. Please check your connection and try again.';
          }
          
          setErrorCode(errorCode);
          setError(errorMessage);
          setProcessing(false);
        }
      } catch (err: any) {
        console.error('[SteamAuth] Error processing callback:', err);
        setErrorCode('processing_error');
        setError(err.message || 'An unexpected error occurred while processing your Steam account information');
        setProcessing(false);
      } finally {
        setProcessing(false);
      }
    };

    // Only run the processing if we have a user
    if (user) {
      processSteamAuth();
    } else {
      console.log('[SteamAuth] No user detected, waiting...');
      // Set a timeout to give auth context time to initialize
      const timer = setTimeout(() => {
        if (!user) {
          console.error('[SteamAuth] No user available after timeout');
          setErrorCode('auth_error');
          setError('Your authentication session was not found. Please try logging in again.');
          setProcessing(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, navigate, steam_id, steam_name, steam_avatar, uid, queryClient]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AuthErrorHandler 
          errorCode={errorCode || 'steam_auth_error'} 
          errorMessage={error}
          onRetry={() => navigate('/')}
          showHomeButton={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <SteamLoader 
        message="Linking your Steam account..." 
        size="md" 
        variant="secondary" 
      />
    </div>
  );
};

export default SteamAuthHandler;

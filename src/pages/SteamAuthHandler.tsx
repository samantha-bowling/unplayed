
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
        
        // Validate required parameters
        if (!steam_id || !steam_name || !uid) {
          console.error('[SteamAuth] Missing required Steam parameters:', {
            steam_id,
            steam_name,
            uid
          });
          setErrorCode('missing_parameters');
          setError('Missing required Steam account information');
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
          // Update user profile with Steam information
          await callUpsertUser({
            id: uid,
            steam_id,
            steam_name: decodeURIComponent(steam_name),
            steam_avatar: steam_avatar ? decodeURIComponent(steam_avatar) : undefined,
            onboarding_complete: true,
          });
          
          // Invalidate profile cache to force refresh with new Steam data
          queryClient.invalidateQueries({ queryKey: ['profile', uid] });
          
          toast.success('Steam account linked successfully!');
          
          // Navigate to library after successful Steam linking
          navigate('/library');
        } catch (err: any) {
          console.error('[SteamAuth] Steam linking error:', err);
          setErrorCode('linking_failed');
          setError(`Failed to link Steam account: ${err.message}`);
          setProcessing(false);
        }
      } catch (err: any) {
        console.error('[SteamAuth] Error processing callback:', err);
        setErrorCode('processing_error');
        setError(err.message);
        setProcessing(false);
      } finally {
        setProcessing(false);
      }
    };

    processSteamAuth();
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

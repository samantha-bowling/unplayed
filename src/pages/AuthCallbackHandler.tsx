
// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';
import { toast } from 'sonner';
import { callUpsertUser } from '@/utils/auth/callUpsertUser';
import { AuthStorage } from '@/utils/auth-service';

const AuthCallbackHandler = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  // Parse Steam parameters
  const steam_id = searchParams.get('steam_id');
  const steam_name = searchParams.get('steam_name');
  const steam_avatar = searchParams.get('steam_avatar');
  const uid = searchParams.get('uid');

  // Handle general auth callback
  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Mark that we're handling an auth callback
        AuthStorage.markFromAuthCallback();
        
        // Check for Steam parameters (handle Steam account linking)
        if (steam_id && steam_name && uid) {
          console.log('[AuthCallback] Processing Steam link callback');
          
          try {
            await callUpsertUser({
              id: uid,
              steam_id,
              steam_name: decodeURIComponent(steam_name),
              steam_avatar: steam_avatar ? decodeURIComponent(steam_avatar) : undefined,
              onboarding_complete: true,
            });
            
            // Save Steam info to localStorage
            localStorage.setItem("steamId", steam_id);
            localStorage.setItem("personaName", decodeURIComponent(steam_name));
            if (steam_avatar) localStorage.setItem("avatar", decodeURIComponent(steam_avatar));
            
            await refreshProfile();
            toast.success('Steam account linked successfully!');
            
            // Navigate to library after successful Steam linking
            navigate('/library');
            return;
          } catch (err: any) {
            console.error('[AuthCallback] Steam linking error:', err);
            setError(`Failed to link Steam account: ${err.message}`);
            toast.error(`Failed to link Steam account: ${err.message}`);
            navigate('/');
            return;
          }
        }
        
        // Handle regular auth callback
        // Check if there's an error in the URL parameters
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        if (errorCode) {
          console.error(`[AuthCallback] Error in URL: ${errorCode} - ${errorDescription}`);
          setError(errorDescription || 'Unknown authentication error');
          navigate('/auth');
          return;
        }
        
        // Get redirect destination if specified
        const redirectTo = AuthStorage.getRedirectPath();
        
        // If user exists, get their profile and check if they have a Steam account
        if (user) {
          // Mark successful login
          AuthStorage.markJustLoggedIn();
          
          const profile = await refreshProfile();
          
          if (profile?.steam_id) {
            // User has Steam linked, go to their library
            navigate('/library');
          } else {
            // User authenticated but needs to link Steam - show button on index page
            navigate('/');
          }
        } else {
          // If no user by this point, send to auth page
          navigate('/auth');
        }
      } catch (err: any) {
        console.error('[AuthCallback] Error processing callback:', err);
        setError(err.message);
        navigate('/auth');
      } finally {
        setProcessing(false);
      }
    };

    processAuthCallback();
  }, [user, refreshProfile, navigate, steam_id, steam_name, steam_avatar, uid, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-400 mb-2">Authentication Error</h2>
          <p className="text-white">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
          >
            Return to Login
          </button>
        </div>
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

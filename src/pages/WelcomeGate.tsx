
// src/pages/WelcomeGate.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamLoader from '@/components/SteamLoader';
import { callUpsertUser } from '@/utils/auth/callUpsertUser';
import { toast } from 'sonner';
import AuthSessionManager, { AuthFlowState } from '@/utils/auth/AuthSessionManager';

const WelcomeGate = () => {
  const {
    user,
    profile,
    refreshProfile,
    isLoading: authLoading,
    isAuthReady
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [hasUpserted, setHasUpserted] = useState(false);
  const [isUpsertInProgress, setIsUpsertInProgress] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[WelcomeGate] Status:', { 
      hasUpserted, 
      isUpsertInProgress,
      profileData: profile,
      userId: user?.id,
      retryCount,
      isAuthReady,
      authLoading,
      loadingProfile,
      justLoggedIn: AuthSessionManager.hasAuthFlag('JUST_LOGGED_IN'),
      authFlowState: AuthSessionManager.getAuthFlowState()
    });
  }, [
    hasUpserted, 
    isUpsertInProgress, 
    profile, 
    user?.id, 
    retryCount, 
    isAuthReady,
    authLoading,
    loadingProfile
  ]);

  // Block navigation until auth is ready
  useEffect(() => {
    if (!isAuthReady || authLoading) {
      console.log('[WelcomeGate] Auth not ready yet, waiting...');
      return;
    }
    
    // If we don't have a user at all, redirect to auth
    if (!user) {
      console.log('[WelcomeGate] No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    // If we have a user but no profile yet, we should do an initial profile check
    if (user && !profile && !loadingProfile) {
      console.log('[WelcomeGate] User found but no profile, checking...');
      setLoadingProfile(true);
      
      refreshProfile()
        .then(refreshedProfile => {
          console.log('[WelcomeGate] Initial profile check result:', refreshedProfile);
          
          // If the user has a complete profile, redirect to library
          if (refreshedProfile?.onboarding_complete) {
            console.log('[WelcomeGate] Profile complete, redirecting to library');
            // Clear the just logged in flag since onboarding is complete
            AuthSessionManager.clearJustLoggedIn();
            AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_READY);
            navigate('/library');
          }
        })
        .catch(err => {
          console.error('[WelcomeGate] Error checking initial profile:', err);
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
    
    // Mark that onboarding has started
    AuthSessionManager.markOnboardingStarted();
    AuthSessionManager.setAuthFlowState(AuthFlowState.ONBOARDING_NEEDED);
  }, [isAuthReady, authLoading, user, profile, navigate, refreshProfile, loadingProfile]);

  // Redirect if onboarding already complete
  useEffect(() => {
    if (profile?.onboarding_complete) {
      console.log('[WelcomeGate] Onboarding already complete, redirecting to library');
      
      // Clear the just logged in flag since onboarding is complete
      AuthSessionManager.clearJustLoggedIn();
      AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_READY);
      
      navigate('/library');
    }
  }, [profile?.onboarding_complete, navigate]);

  // Handle Steam parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const steam_id = params.get('steam_id');
    const steam_name = params.get('steam_name');
    const steam_avatar = params.get('steam_avatar');
    const uid = params.get('uid');

    // Clear parameters from URL to prevent repeated processing
    if (steam_id && steam_name && uid && window.history.replaceState) {
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    // Wait for profile to be available after upsert
    const waitForProfile = async (id: string, maxRetries = 5, delayMs = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
        console.log(`[WelcomeGate] Polling for profile (attempt ${i + 1}/${maxRetries})`);
        try {
          const refreshed = await refreshProfile();
          if (refreshed && refreshed.id === id) {
            console.log('[WelcomeGate] Profile found on attempt', i + 1);
            return true;
          }
        } catch (err) {
          console.error('[WelcomeGate] Error refreshing profile:', err);
        }
        
        setRetryCount(prev => prev + 1);
        await new Promise((r) => setTimeout(r, delayMs));
      }
      console.warn('[WelcomeGate] Max retries reached, profile not found');
      return false;
    };

    if (user && steam_id && steam_name && uid && !hasUpserted && !isUpsertInProgress) {
      setIsUpsertInProgress(true);
      setError(null);
      
      console.log('[WelcomeGate] Starting upsert process', { steam_id, steam_name, uid });
      AuthSessionManager.setAuthFlowState(AuthFlowState.STEAM_LINKING_STARTED);
      
      callUpsertUser({
        id: uid,
        steam_id,
        steam_name: decodeURIComponent(steam_name),
        steam_avatar: steam_avatar ? decodeURIComponent(steam_avatar) : undefined,
        onboarding_complete: true,
      })
        .then(() => {
          console.log('[WelcomeGate] Upsert successful, waiting for profile');
          setHasUpserted(true);
          AuthSessionManager.setAuthFlowState(AuthFlowState.STEAM_LINKED);
          return waitForProfile(uid);
        })
        .then((success) => {
          if (success) {
            console.log('[WelcomeGate] Profile confirmed, redirecting to library');
            
            // Clear the just logged in flag since onboarding is complete
            AuthSessionManager.clearJustLoggedIn();
            AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_READY);
            
            toast.success('Steam account linked successfully!');
            navigate('/library');
          } else {
            setError('Unable to confirm profile after upsert. Please try again.');
            AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
            toast.error('Unable to confirm your profile. Please try again.');
          }
        })
        .catch((err) => {
          console.error('[WelcomeGate] Steam onboarding failed:', err);
          setError(`Failed to link Steam: ${err.message}`);
          AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
          toast.error(`Failed to link Steam: ${err.message}`);
        })
        .finally(() => {
          setIsUpsertInProgress(false);
        });
    }
  }, [user, location.search, hasUpserted, isUpsertInProgress, refreshProfile, navigate]);

  // Don't render anything until we're sure auth is ready
  if (!isAuthReady || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message="Preparing onboarding..." 
          size="md" 
          variant="primary" 
        />
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    console.log('[WelcomeGate] No user in render phase, redirecting to auth');
    navigate('/auth');
    return null;
  }

  const needsSteam = !profile?.steam_id;
  const isLoading = isUpsertInProgress || loadingProfile;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      {isLoading ? (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            {isUpsertInProgress ? 'Linking Your Steam Account...' : 'Checking Your Profile...'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isUpsertInProgress 
              ? "We're linking your Steam account. This should only take a moment."
              : "We're checking your profile. This should only take a moment."}
          </p>
          <SteamLoader 
            message={isUpsertInProgress 
              ? "Linking your Steam account..." 
              : "Checking your profile..."} 
            size="md" 
            variant="primary" 
          />
        </div>
      ) : needsSteam ? (
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Unplayed</h1>
          <p className="text-muted-foreground text-sm">
            To get started, link your Steam account and let us build your personalized backlog.
          </p>

          <div className="bg-destructive/10 text-destructive text-sm rounded-md p-4 text-left">
            <p className="font-semibold mb-2">Before you link your Steam account:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Go to <a href="https://steamcommunity.com/my/edit/settings" className="underline">Steam Profile Privacy Settings</a>
              </li>
              <li>Set <strong>Game details</strong> to <code>Public</code></li>
              <li>Uncheck <em>"Always keep my total playtime private"</em></li>
              <li>Save settings and return here to continue</li>
            </ul>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acknowledgedPrivacy}
              onChange={(e) => setAcknowledgedPrivacy(e.target.checked)}
            />
            I've updated my Steam privacy settings
          </label>

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded text-left">
              <p className="font-semibold text-red-400">Error linking Steam account:</p>
              <p className="text-white/80 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-400 hover:text-red-300 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <SteamLoginButton fullWidth disabled={!acknowledgedPrivacy} />
        </div>
      ) : null}
    </div>
  );
};

export default WelcomeGate;

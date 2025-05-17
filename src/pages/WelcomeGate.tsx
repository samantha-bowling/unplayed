
// src/pages/WelcomeGate.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, EnhancedAuthStatus } from '@/context/AuthContext';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamLoader from '@/components/SteamLoader';
import { callUpsertUser } from '@/utils/auth/callUpsertUser';
import { toast } from 'sonner';

const WelcomeGate = () => {
  const {
    user,
    profile,
    enhancedStatus,
    refreshProfile,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [hasUpserted, setHasUpserted] = useState(false);
  const [isUpsertInProgress, setIsUpsertInProgress] = useState(false);
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('[WelcomeGate] Status:', { 
      enhancedStatus, 
      hasUpserted, 
      isUpsertInProgress,
      profileData: profile,
      userId: user?.id,
      retryCount
    });
  }, [enhancedStatus, hasUpserted, isUpsertInProgress, profile, user?.id, retryCount]);

  // Redirect if onboarding already complete
  useEffect(() => {
    if (profile?.onboarding_complete) {
      console.log('[WelcomeGate] Onboarding already complete, redirecting to library');
      navigate('/library');
    }
  }, [profile?.onboarding_complete, navigate]);

  // Polling logic to ensure profile is ready before continuing
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
          return waitForProfile(uid);
        })
        .then((success) => {
          if (success) {
            console.log('[WelcomeGate] Profile confirmed, redirecting to library');
            toast.success('Steam account linked successfully!');
            navigate('/library');
          } else {
            setError('Unable to confirm profile after upsert. Please try again.');
            toast.error('Unable to confirm your profile. Please try again.');
          }
        })
        .catch((err) => {
          console.error('[WelcomeGate] Steam onboarding failed:', err);
          setError(`Failed to link Steam: ${err.message}`);
          toast.error(`Failed to link Steam: ${err.message}`);
        })
        .finally(() => {
          setIsUpsertInProgress(false);
        });
    }
  }, [user, location.search, hasUpserted, isUpsertInProgress, refreshProfile, navigate, setRetryCount]);

  if (!user) return null;

  const needsSteam = !profile?.steam_id;
  const isImporting = enhancedStatus === EnhancedAuthStatus.LIBRARY_IMPORTING;
  const isLoading = isUpsertInProgress || isImporting;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      {isLoading ? (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            {isImporting ? 'Building Your Backlog...' : 'Linking Your Steam Account...'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isImporting 
              ? "We're importing your Steam library. Hang tight." 
              : "We're linking your Steam account. This should only take a moment."}
          </p>
          <SteamLoader 
            message={isImporting 
              ? "Importing your games from Steam..." 
              : "Linking your Steam account..."} 
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

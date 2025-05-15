
// src/pages/WelcomeGate.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, EnhancedAuthStatus } from '@/context/AuthContext';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamLoader from '@/components/SteamLoader';
import { callUpsertUser } from '@/utils/auth/callUpsertUser';

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
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);

  // Redirect if onboarding already complete
  useEffect(() => {
    if (profile?.onboarding_complete) {
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

    const waitForProfile = async (id: string, maxRetries = 5, delayMs = 500) => {
      for (let i = 0; i < maxRetries; i++) {
        const refreshed = await refreshProfile();
        if (refreshed && refreshed.id === id) return true;
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return false;
    };

    if (user && steam_id && steam_name && uid && !hasUpserted) {
      callUpsertUser({
        id: uid,
        steam_id,
        steam_name: decodeURIComponent(steam_name),
        steam_avatar: steam_avatar ? decodeURIComponent(steam_avatar) : undefined,
        onboarding_complete: true,
      })
        .then(() => {
          setHasUpserted(true);
          return waitForProfile(uid);
        })
        .then((success) => {
          if (success) {
            navigate('/library');
          } else {
            console.warn('User profile not available after upsert.');
          }
        })
        .catch((err) => {
          console.error('Steam onboarding failed:', err);
        });
    }
  }, [user, location.search, hasUpserted, refreshProfile, navigate]);

  if (!user) return null;

  const needsSteam = !profile?.steam_id;
  const isImporting = enhancedStatus === EnhancedAuthStatus.LIBRARY_IMPORTING;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      {isImporting ? (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Building Your Backlog...</h1>
          <p className="text-muted-foreground text-sm">
            We're importing your Steam library. Hang tight.
          </p>
          <SteamLoader message="Importing your games from Steam..." size="md" variant="primary" />
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

          <SteamLoginButton fullWidth disabled={!acknowledgedPrivacy} />
        </div>
      ) : null}
    </div>
  );
};

export default WelcomeGate;

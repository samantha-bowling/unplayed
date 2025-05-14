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

  // ✅ Redirect if onboarding already completed
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/library');
    }
  }, [profile?.onboarding_complete, navigate]);

  // ✅ Handle redirect back from Steam login with metadata
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const steam_id = params.get('steam_id');
    const steam_name = params.get('steam_name');
    const steam_avatar = params.get('steam_avatar');
    const uid = params.get('uid');

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
          return refreshProfile();
        })
        .then(() => navigate('/library'))
        .catch((err) => {
          console.error('Steam onboarding failed:', err);
        });
    }
  }, [user, location.search, hasUpserted, refreshProfile, navigate]);

  if (!user) return null;

  const needsSteam = !profile?.steam_id;
  const isImporting = enhancedStatus === EnhancedAuthStatus.LIBRARY_IMPORTING;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      {isImporting ? (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Building Your Backlog...</h1>
          <p className="text-muted-foreground text-sm">
            We’re importing your Steam library. Hang tight.
          </p>
          <SteamLoader />
        </div>
      ) : needsSteam ? (
        <div className="space-y-6 w-full max-w-sm">
          <h1 className="text-3xl font-bold">Welcome to Unplayed</h1>
          <p className="text-muted-foreground text-sm">
            To get started, link your Steam account and let us build your personalized backlog.
          </p>
          <SteamLoginButton fullWidth />
        </div>
      ) : null}
    </div>
  );
};

export default WelcomeGate;

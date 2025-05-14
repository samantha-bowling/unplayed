
import { useEffect } from 'react';
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
    isLoading,
    refreshProfile,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Skip onboarding if it's already complete
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/');
    }
  }, [profile?.onboarding_complete, navigate]);

  // ✅ Process Steam callback params only once
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const steamId = params.get('steam_id');
    const steamName = params.get('steam_name');
    const steamAvatar = params.get('steam_avatar');
    const uid = params.get('uid');

    const alreadyLinked = profile?.steam_id || profile?.onboarding_complete;
    const isImporting = enhancedStatus === EnhancedAuthStatus.LIBRARY_IMPORTING;

    if (!user || !steamId || !steamName || alreadyLinked || isImporting) return;

    const handleUpsert = async () => {
      try {
        await callUpsertUser({
          id: user.id,
          steam_id: steamId,
          steam_name: decodeURIComponent(steamName),
          steam_avatar: steamAvatar ? decodeURIComponent(steamAvatar) : undefined,
          onboarding_complete: true,
        });
        await refreshProfile();

        // Clean the URL
        window.history.replaceState({}, document.title, location.pathname);
        navigate('/library');
      } catch (err) {
        console.error('Steam upsert failed:', err);
        toast.error('Failed to complete Steam linking. Please try again.');
        navigate('/auth');
      }
    };

    handleUpsert();
  }, [user, profile, enhancedStatus, location.search, refreshProfile, navigate]);

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

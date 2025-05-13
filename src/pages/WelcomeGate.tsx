
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, EnhancedAuthStatus } from '@/context/AuthContext';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamLoader from '@/components/SteamLoader';

const WelcomeGate = () => {
  const {
    user,
    profile,
    enhancedStatus,
    isLoading,
  } = useAuth();
  const navigate = useNavigate();

  // ✅ Skip onboarding if it's already complete
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/');
    }
  }, [profile?.onboarding_complete, navigate]);

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

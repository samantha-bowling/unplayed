// src/pages/AuthCallbackHandler.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from '@/components/SteamLoader';

const AuthCallbackHandler = () => {
  const {
    user,
    refreshSession,
    refreshProfile,
  } = useAuth();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // Wait until user is available

    const processAuth = async () => {
      try {
        await refreshSession();
        const updatedProfile = await refreshProfile();

        if (user && !updatedProfile) {
          console.info('[AuthCallbackHandler] New user detected — redirecting to /welcome.');
          navigate('/welcome');
        } else if (user && updatedProfile) {
          navigate('/library');
        } else {
          console.warn('[AuthCallbackHandler] No authenticated user found — redirecting to /auth.');
          navigate('/auth');
        }
      } catch (err) {
        console.error('[AuthCallbackHandler] Error during auth processing:', err);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    processAuth();
  }, [refreshSession, refreshProfile, navigate, user]);

  return (
    <div className="flex items-center justify-center h-screen">
      <SteamLoader message="Validating your session..." size="md" variant="secondary" />
    </div>
  );
};

export default AuthCallbackHandler;

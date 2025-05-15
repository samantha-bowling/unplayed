// src/pages/AuthCallbackHandler.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AuthCallbackHandler = () => {
  const {
    user,
    refreshSession,
    refreshProfile,
  } = useAuth();

  const navigate = useNavigate();

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
      }
    };

    processAuth();
  }, [refreshSession, refreshProfile, navigate, user]);

  return (
    <div className="flex items-center justify-center h-screen text-muted-foreground">
      Processing login...
    </div>
  );
};

export default AuthCallbackHandler;

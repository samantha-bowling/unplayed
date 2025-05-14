
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AuthCallbackHandler = () => {
  const {
    user,
    profile,
    refreshSession,
    refreshProfile,
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      await refreshSession();
      await refreshProfile();

      if (!profile) {
        console.info('[AuthCallbackHandler] No user profile found — redirecting to welcome flow.');
        navigate('/welcome');
        return;
      }

      navigate('/library');
    };

    processAuth();
  }, [refreshSession, refreshProfile, profile, navigate]);

  return null;
};

export default AuthCallbackHandler;

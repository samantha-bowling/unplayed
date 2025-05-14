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
    const processAuth = async () => {
      await refreshSession();
      const updatedProfile = await refreshProfile();

      if (!updatedProfile) {
        console.info('[AuthCallbackHandler] No user profile found — redirecting to welcome flow.');
        navigate('/welcome');
        return;
      }

      navigate('/library');
    };

    processAuth();
  }, [refreshSession, refreshProfile, navigate]);

  return null;
};

export default AuthCallbackHandler;

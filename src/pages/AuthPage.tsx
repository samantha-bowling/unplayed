// src/pages/AuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import DemoModeFallback from '@/components/DemoModeFallback';
import { AuthStorage } from '@/utils/auth-service';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';

const AuthPage = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const { signInWithProvider, isLoading, error, status, user, clearError } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const handleProviderSignIn = async (provider: 'discord' | 'twitch') => {
    // Clear any caches if user was previously logged in with a different account
    queryClient.invalidateQueries();
    
    await signInWithProvider(provider, { 
      redirectTo: `${window.location.origin}/auth/callback` 
    });
  };

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (user) {
      // Prefetch critical user data in the background
      queryClient.prefetchQuery({
        queryKey: queryKeys.profile(user.id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.unifiedLibrary.data(user.id),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
      
      // Then redirect
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirectTo') || AuthStorage.getRedirectPath();
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location.search, queryClient]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 max-w-md">
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
              <h3 className="text-red-400 font-bold">Authentication Error</h3>
              <p className="text-white/90">{error.message}</p>
              <button 
                onClick={clearError}
                className="text-xs mt-2 text-red-400 hover:text-red-300 underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !error && (
        <div className="space-y-6 w-full max-w-sm">
          <h1 className="text-3xl font-bold">Sign in to unplayed</h1>
          <p className="text-muted-foreground text-sm">
            Connect your account to start managing your backlog.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button onClick={() => handleProviderSignIn('discord')}>
              Sign in with Discord
            </Button>
            <Button onClick={() => handleProviderSignIn('twitch')}>
              Sign in with Twitch
            </Button>
            
            <div className="mt-8 text-xs text-gray-500 space-y-1">
              <p>
                After signing in, you'll be able to link your Steam account.
              </p>
              <p>
                By signing in you agree to our{" "}
                <button 
                  className="text-unplayed-mint hover:underline" 
                  onClick={() => setTermsOfServiceOpen(true)}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button 
                  className="text-unplayed-mint hover:underline"
                  onClick={() => setPrivacyPolicyOpen(true)}
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <PrivacyPolicyDialog open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen} />
      <TermsOfServiceDialog open={termsOfServiceOpen} onOpenChange={setTermsOfServiceOpen} />

      <DemoModeFallback />
    </div>
  );
};

export default AuthPage;

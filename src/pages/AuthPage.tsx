
// src/pages/AuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import DemoModeFallback from '@/components/DemoModeFallback';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { AuthStorage } from '@/utils/auth-service';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const { signInWithProvider, signInWithEmail, isLoading, error, status, user, clearError } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleEmailLogin = async () => {
    clearError();
    await signInWithEmail(email);
    setShowSuccessAnimation(true);
  };

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (user) {
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirectTo') || AuthStorage.getRedirectPath();
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, location.search]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </motion.div>
        )}

        {showSuccessAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
            <AuthSuccessAnimation />
          </motion.div>
        )}

        {error && !isLoading && !showSuccessAnimation && (
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

      {!isLoading && !error && !showSuccessAnimation && (
        <div className="space-y-6 w-full max-w-sm">
          <h1 className="text-3xl font-bold">Sign in to unplayed</h1>
          <p className="text-muted-foreground text-sm">
            Connect your account to start managing your backlog.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button onClick={() => signInWithProvider('discord', { redirectTo: `${window.location.origin}/auth/callback` })}>
              Sign in with Discord
            </Button>
            <Button onClick={() => signInWithProvider('twitch', { redirectTo: `${window.location.origin}/auth/callback` })}>
              Sign in with Twitch
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-gray-400">OR</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900"
              />
              <Button 
                className="w-full" 
                onClick={handleEmailLogin} 
                disabled={!email}
                variant="secondary"
              >
                Send Magic Link
              </Button>
            </div>
            
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

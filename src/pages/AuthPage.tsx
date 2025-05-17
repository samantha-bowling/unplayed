
// src/pages/AuthPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, EnhancedAuthStatus } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import DemoModeFallback from '@/components/DemoModeFallback';
import { SteamIcon } from '@/components/icons/SteamIcon';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { signInWithProvider, signInWithEmail, isLoading, lastError, clearAuthError } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleEmailLogin = async () => {
    clearAuthError();
    await signInWithEmail(email);
    setShowSuccessAnimation(true);
  };

  const handleRetry = () => {
    setIsRetrying(true);
    clearAuthError();
    // Simulate retry delay
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get('redirectTo');

    if (!isLoading && !lastError && showSuccessAnimation === false && redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, lastError, showSuccessAnimation, location, navigate]);

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

        {lastError && !isLoading && !showSuccessAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
            <AuthErrorMessage 
              errorType={EnhancedAuthStatus.AUTH_ERROR} 
              error={lastError} 
              onRetry={handleRetry}
              isRetrying={isRetrying} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !lastError && !showSuccessAnimation && (
        <div className="space-y-6 w-full max-w-sm">
          <h1 className="text-3xl font-bold">Sign in to Unplayed</h1>
          <p className="text-muted-foreground text-sm">
            Connect your account to start managing your backlog.
          </p>
          
          <div className="flex flex-col gap-4">
            <Button onClick={() => signInWithProvider('discord', { redirectTo: window.location.origin })}>
              Sign in with Discord
            </Button>
            <Button onClick={() => signInWithProvider('twitch', { redirectTo: window.location.origin })}>
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


import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import DemoModeFallback from '@/components/DemoModeFallback';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const { signInWithProvider, signInWithEmail, isLoading, lastError, clearAuthError } = useAuth();

  const handleEmailLogin = async () => {
    clearAuthError();
    await signInWithEmail(email);
    setShowSuccessAnimation(true);
  };

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
            <AuthErrorMessage error={lastError} onRetry={clearAuthError} isRetrying={false} />
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
            <Button onClick={() => signInWithProvider('discord', { redirectTo: window.location.origin })}>Sign in with Discord</Button>
            <Button onClick={() => signInWithProvider('twitch', { redirectTo: window.location.origin })}>Sign in with Twitch</Button>
            <div className="border-t pt-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button className="mt-2" onClick={handleEmailLogin} disabled={!email}>
                Send Magic Link
              </Button>
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

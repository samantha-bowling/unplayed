
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const AuthModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { signInWithProvider, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleProviderLogin = (provider: 'discord' | 'twitch') => {
    signInWithProvider(provider, { redirectTo: window.location.origin });
    onOpenChange(false); // close modal
  };

  const handleEmailSubmit = () => {
    if (email) {
      signInWithEmail(email);
      onOpenChange(false); // close modal
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Sign In to Unplayed</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose a provider to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button onClick={() => handleProviderLogin('discord')}>Continue with Discord</Button>
          <Button onClick={() => handleProviderLogin('twitch')}>Continue with Twitch</Button>

          {!showEmailInput ? (
            <Button variant="secondary" onClick={() => setShowEmailInput(true)}>
              Use Email
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-2 rounded-md border border-gray-700 bg-black text-white"
              />
              <Button variant="secondary" onClick={handleEmailSubmit}>
                Send Magic Link
              </Button>
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-2">
            After signing in, you'll be able to link your Steam account to access your game library.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AuthModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { signInWithProvider, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleEmailSubmit = () => {
    if (email) {
      signInWithEmail(email);
    }
  };

  const redirectTo = 'https://unplayed.wtf/auth/callback';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Sign In to Unplayed</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose a provider to continue. You’ll link your Steam account after login.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button onClick={() => signInWithProvider('discord', { redirectTo })}>Continue with Discord</Button>
          <Button onClick={() => signInWithProvider('twitch', { redirectTo })}>Continue with Twitch</Button>

          {!showEmailInput ? (
            <Button variant="secondary" onClick={() => setShowEmailInput(true)}>Use Email</Button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-2 rounded-md border border-gray-700 bg-black text-white"
              />
              <Button variant="secondary" onClick={handleEmailSubmit}>Send Magic Link</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

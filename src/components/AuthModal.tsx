
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const AuthModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { signInWithProvider } = useAuth();

  const handleProviderLogin = (provider: 'discord' | 'twitch') => {
    signInWithProvider(provider, { redirectTo: window.location.origin });
    onOpenChange(false); // close modal
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
          
          <p className="text-xs text-gray-400 mt-2">
            After signing in, you'll be able to link your Steam account to access your game library.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

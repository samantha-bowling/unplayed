// src/components/AuthModal.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import DiscordIcon from './icons/DiscordIcon';
import TwitchIcon from './icons/TwitchIcon';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signInWithProvider, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');

  const handleEmailSubmit = () => {
    if (email) {
      signInWithEmail(email);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Sign In to Unplayed
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in to get started — you'll link your Steam account next.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => {
              signInWithProvider('discord', { redirectTo: '/' });
              onOpenChange(false);
            }}
          >
            <DiscordIcon className="w-5 h-5" /> Continue with Discord
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => {
              signInWithProvider('twitch', { redirectTo: '/' });
              onOpenChange(false);
            }}
          >
            <TwitchIcon className="w-5 h-5" /> Continue with Twitch
          </Button>

          <div className="relative">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEmailSubmit();
              }}
            />
            <Button
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onClick={handleEmailSubmit}
            >
              Go
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

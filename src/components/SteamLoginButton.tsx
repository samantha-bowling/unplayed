
// src/components/SteamLoginButton.tsx
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { toast } from 'sonner';

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean;
  disabled?: boolean;
  showInHeader?: boolean;
}

/**
 * Button component for linking a Steam account to an already authenticated user.
 * This is NOT for authentication - users must be logged in via Email, Discord, or Twitch first.
 */
const SteamLoginButton = ({
  className = '',
  redirectPath = '/',
  fullWidth = false,
  centered = true,
  disabled = false,
  showInHeader = true,
}: SteamLoginButtonProps) => {
  // If this is being rendered in the header and we don't want to show it there, return null
  if (showInHeader === false) {
    return null;
  }

  const { user, signInWithProvider } = useAuth();
  const { profile } = useProfile();
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSteamLink = () => {
    if (!user) {
      console.error('[Steam Auth] Cannot link Steam account: User not authenticated');
      toast.error("You need to be logged in to link your Steam account");
      return;
    }
    
    setButtonLoading(true);
    console.log('[Steam Auth] Starting Steam account linking process for user', user.id);
    
    // Use the centralized signInWithProvider method with steam provider
    signInWithProvider('steam', { redirectTo: `${window.location.origin}/auth/steam-callback` })
      .catch((error) => {
        console.error('[Steam Auth] Error initiating Steam auth:', error);
        toast.error("Failed to start Steam authentication. Please try again.");
        setButtonLoading(false);
      });
  };

  // Don't show button if user already has Steam linked
  if (profile?.steam_id) {
    return null;
  }

  return (
    <div className={`${centered ? 'mx-auto' : ''} group w-full max-w-xs`}>
      <button
        onClick={handleSteamLink}
        className={`
          ${fullWidth ? 'w-full' : ''}
          ${centered ? 'mx-auto' : ''}
          relative flex items-center justify-center transition-all
          hover:opacity-90
          ${className}
          ${(buttonLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
          group-hover:shadow-lg group-hover:shadow-unplayed-mint/20
        `}
        disabled={buttonLoading || !user || disabled}
        aria-label="Link your Steam account"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-unplayed-mint/10 to-unplayed-pink/10 opacity-0 group-hover:opacity-100 rounded transition-opacity"></div>
        <img
          src="/lovable-uploads/0b70a4e5-f3cb-44e0-bb0b-bf29ee038fa3.png"
          alt="Link your Steam account (not affiliated with Valve Corp.)"
          className={`${fullWidth ? 'w-full' : 'w-auto'} h-auto relative z-10`}
        />
      </button>
    </div>
  );
};

export default SteamLoginButton;

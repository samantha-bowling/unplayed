
// src/components/SteamLoginButton.tsx
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean;
  disabled?: boolean; // Add disabled prop
}

const SteamLoginButton = ({
  className = '',
  redirectPath = '/',
  fullWidth = false,
  centered = true,
  disabled = false, // Default value
}: SteamLoginButtonProps) => {
  const { user, isLoading } = useAuth();
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSteamLogin = () => {
    if (!user) return;
    setButtonLoading(true);
    const uid = encodeURIComponent(user.id);
    window.location.href = `/api/auth/steam/login?uid=${uid}`;
  };

  return (
    <div className={`${centered ? 'mx-auto' : ''} group w-full max-w-xs`}>
      <button
        onClick={handleSteamLogin}
        className={`
          ${fullWidth ? 'w-full' : ''}
          ${centered ? 'mx-auto' : ''}
          relative flex items-center justify-center transition-all
          hover:opacity-90
          ${className}
          ${(buttonLoading || isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
          group-hover:shadow-lg group-hover:shadow-unplayed-mint/20
        `}
        disabled={buttonLoading || isLoading || !user || disabled}
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

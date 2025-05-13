
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean;
}

const SteamLoginButton = ({ 
  className = '', 
  redirectPath = '/',
  fullWidth = false,
  centered = true
}: SteamLoginButtonProps) => {
  const { signInWithSteam, isLoading } = useAuth();
  const navigate = useNavigate();
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSteamLogin = () => {
    const redirectTo = encodeURIComponent(redirectPath);
    window.location.href = `/api/auth/steam/login?redirectTo=${redirectTo}`;
  };

  return (
    <div className={`${centered ? 'mx-auto' : ''} group w-full max-w-xs`}>
      <button 
        onClick={handleSteamLogin}
        className={`${fullWidth ? 'w-full' : ''} 
                   ${centered ? 'mx-auto' : ''} 
                   relative flex items-center justify-center transition-all hover:opacity-90 ${className}
                   ${buttonLoading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                   group-hover:shadow-lg group-hover:shadow-unplayed-mint/20 transition-all`}
        disabled={buttonLoading || isLoading}
        aria-label="Sign in through Steam"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-unplayed-mint/10 to-unplayed-pink/10 opacity-0 group-hover:opacity-100 rounded transition-opacity"></div>
        <img 
          src="/lovable-uploads/0b70a4e5-f3cb-44e0-bb0b-bf29ee038fa3.png"
          alt="Sign in through STEAM" 
          className={`${fullWidth ? 'w-full' : 'w-auto'} h-auto relative z-10`}
        />
      </button>
    </div>
  );
};

export default SteamLoginButton;

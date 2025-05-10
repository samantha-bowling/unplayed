
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
  centered = false
}: SteamLoginButtonProps) => {
  const { signInWithSteam } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSteamLogin = async () => {
    try {
      console.log("[Steam Login Button] Initiating Steam login, redirectPath:", redirectPath);
      setIsLoading(true);
      await signInWithSteam(redirectPath);
      // Note: This code will not execute immediately as the user will be redirected to Steam
    } catch (error) {
      console.error('[Steam Login Button] Error during Steam login:', error);
      setIsLoading(false);
      navigate('/auth');
    }
  };

  return (
    <div className={`${centered ? 'mx-auto' : ''}`}>
      <button 
        onClick={handleSteamLogin}
        className={`${fullWidth ? 'w-full' : ''} 
                   ${centered ? 'mx-auto' : ''} 
                   flex items-center justify-center transition-opacity hover:opacity-90 ${className}
                   ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
        aria-label="Sign in through Steam"
      >
        <img 
          src="/lovable-uploads/0b70a4e5-f3cb-44e0-bb0b-bf29ee038fa3.png"
          alt="Sign in through STEAM" 
          className={`${fullWidth ? 'w-full' : 'w-auto'} h-auto`}
        />
      </button>
    </div>
  );
};

export default SteamLoginButton;

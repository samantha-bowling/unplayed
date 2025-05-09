
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean; // New prop to control centering
}

const SteamLoginButton = ({ 
  className = '', 
  redirectPath = '/',
  fullWidth = false,
  centered = false
}: SteamLoginButtonProps) => {
  const { signInWithSteam } = useAuth();
  const navigate = useNavigate();

  const handleSteamLogin = async () => {
    try {
      await signInWithSteam(redirectPath);
      // Note: This code will not execute immediately as the user will be redirected to Steam
    } catch (error) {
      console.error('Error during Steam login:', error);
      navigate('/auth');
    }
  };

  return (
    <button 
      onClick={handleSteamLogin}
      className={`${fullWidth ? 'w-full' : ''} 
                 ${centered ? 'mx-auto' : ''} 
                 flex items-center justify-center transition-opacity hover:opacity-90 ${className}`}
    >
      <img 
        src="/lovable-uploads/0b70a4e5-f3cb-44e0-bb0b-bf29ee038fa3.png"
        alt="Sign in through STEAM" 
        className={`${fullWidth ? 'w-full' : 'w-auto'} h-auto`}
      />
    </button>
  );
};

export default SteamLoginButton;

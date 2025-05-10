
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean; // New prop to control centering
  showDebugLink?: boolean; // New prop to show debug link
}

const SteamLoginButton = ({ 
  className = '', 
  redirectPath = '/',
  fullWidth = false,
  centered = false,
  showDebugLink = true
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
    <div className={`relative ${centered ? 'mx-auto' : ''}`}>
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
      
      {showDebugLink && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => navigate('/auth-debug')}
                className="absolute -top-2 -right-2 text-gray-400 hover:text-unplayed-mint" 
                aria-label="Auth Debug"
              >
                <HelpCircle size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auth Diagnostic Tools</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default SteamLoginButton;

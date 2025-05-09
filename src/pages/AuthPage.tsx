
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithSteam, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    // If user is already logged in, redirect to the intended page
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSteamLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithSteam();
    } catch (error) {
      console.error('Error during Steam login:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Could not authenticate with Steam. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-4xl font-space font-bold mb-8">
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </div>
        
        <div className="w-full max-w-md terminal-container">
          <h1 className="terminal-header text-2xl mb-6">Authentication Required</h1>
          
          <div className="space-y-6">
            <p className="text-gray-300 text-center">
              To access your Steam library data, please authenticate with your Steam account.
            </p>
            
            <div className="terminal-box p-4 mb-4 bg-gray-900 rounded-md">
              <p className="text-sm text-gray-400 font-mono">
                <span className="text-unplayed-mint">$</span> We need access to scan your Steam library and provide backlog insights. Your account security is safe - we only access your public game data.
              </p>
            </div>
            
            <button
              onClick={handleSteamLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1b2838] hover:bg-[#2a3f5a] transition-colors rounded-md"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-unplayed-mint border-t-transparent rounded-full" />
              ) : (
                <>
                  <SteamIcon className="w-6 h-6" />
                  <span>Login with Steam</span>
                </>
              )}
            </button>
            
            <div className="text-xs text-gray-500 text-center">
              By logging in, you agree to our{' '}
              <a href="#" className="text-unplayed-mint hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-unplayed-mint hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

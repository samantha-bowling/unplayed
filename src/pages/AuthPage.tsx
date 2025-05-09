
import { useState, useEffect } from 'react';
import { useAuth, AuthStatus } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithSteam, authStatus, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the redirect path from location state or query params
  const from = 
    (location.state as { from?: { pathname: string } })?.from?.pathname || 
    new URLSearchParams(location.search).get('redirectTo') ||
    '/';

  useEffect(() => {
    // If user is already logged in, redirect to the intended page
    if (authStatus === AuthStatus.AUTHENTICATED && user) {
      navigate(from, { replace: true });
    }
  }, [authStatus, user, navigate, from]);

  const handleSteamLogin = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    try {
      setIsLoading(true);
      await signInWithSteam(from);
    } catch (error) {
      console.error('Error during Steam login:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Could not authenticate with Steam. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          className="text-4xl font-space font-bold mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </motion.div>
        
        <motion.div 
          className="w-full max-w-md terminal-container"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
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
            
            <motion.button
              onClick={handleSteamLogin}
              disabled={isLoading || authStatus === AuthStatus.LOADING}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#1b2838] hover:bg-[#2a3f5a] transition-colors rounded-md relative overflow-hidden group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Steam-styled loading animation */}
              {(isLoading || authStatus === AuthStatus.LOADING) ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-unplayed-mint" />
                  <span>Connecting to Steam...</span>
                </div>
              ) : (
                <>
                  <SteamIcon className="w-6 h-6" />
                  <span>Login with Steam</span>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-unplayed-mint group-hover:w-full transition-all duration-300"></div>
                </>
              )}
            </motion.button>
            
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
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AuthPage;

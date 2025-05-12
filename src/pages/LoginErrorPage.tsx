
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { authStatus } = useAuth();
  const [countdown, setCountdown] = useState(10);

  // Get error details from URL
  const errorCode = searchParams.get('error_code') || 'unknown_error';
  const errorMessage = searchParams.get('error_message') 
    ? decodeURIComponent(searchParams.get('error_message') || '')
    : 'An unknown authentication error occurred';
  const errorId = searchParams.get('error_id');
  const errorDetails = searchParams.get('error_details')
    ? JSON.parse(decodeURIComponent(searchParams.get('error_details') || '{}'))
    : null;
    
  // Auto-redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigateToHome();
    }
  }, [countdown]);

  const navigateToHome = () => {
    navigate('/', { replace: true });
    toast({
      title: 'Redirected to home',
      description: 'You can try logging in again from the home page.',
    });
  };
  
  const handleRetry = () => {
    navigate('/auth', { replace: true });
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
          className="w-full max-w-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="terminal-container mb-8">
            <h1 className="terminal-header text-2xl mb-6 text-gray-300">Login Error</h1>
            
            <div className="space-y-6">
              <AuthErrorHandler 
                errorCode={errorCode} 
                errorMessage={errorMessage} 
                errorId={errorId} 
                onRetry={handleRetry}
                className="mb-6"
              />
              
              <div className="terminal-box p-4 bg-gray-900/50 rounded-md mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    <span>Redirecting to home in </span> 
                    <span className="text-unplayed-mint font-mono">{countdown}</span>
                    <span> seconds...</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={navigateToHome}
                    className="h-7 text-xs"
                  >
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginErrorPage;

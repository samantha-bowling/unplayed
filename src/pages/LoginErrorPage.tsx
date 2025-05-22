
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth, AuthStatus } from '@/context/AuthContext';
import { AuthLayout } from '@/layouts';

const LoginErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { status } = useAuth();
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

  // Detect token generation errors specifically
  const isTokenError = errorCode === 'token_generation_error' || 
                       errorMessage.toLowerCase().includes('token') || 
                       errorMessage.toLowerCase().includes('jwt');

  return (
    <AuthLayout>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full"
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
            
            {isTokenError && (
              <motion.div 
                className="p-4 border border-unplayed-amber/30 rounded-md bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-unplayed-amber mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-unplayed-amber mb-1">JWT Token Error</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      This appears to be an issue with authentication token generation. 
                      Please try the following:
                    </p>
                    <ul className="text-xs text-gray-400 list-disc pl-5 space-y-1">
                      <li>Clear your browser cache and cookies</li>
                      <li>Try using a different browser</li>
                      <li>If the issue persists, please contact support with error ID: {errorId || 'N/A'}</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
            
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
    </AuthLayout>
  );
};

export default LoginErrorPage;

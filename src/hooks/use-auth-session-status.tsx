
import { useState, useEffect } from 'react';
import { useAuth, AuthStatus, AuthError } from '@/context/AuthContext';
import { EnhancedAuthStatus, mapToEnhancedStatus } from '@/utils/auth-compatibility';

export interface AuthSessionState {
  isInitializing: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  isProfileLoaded: boolean;
  hasError: boolean;
  error: AuthError | null;
  retryCount: number;
}

export function useAuthSessionStatus() {
  const { status, error, refreshProfile, isLoading } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [sessionState, setSessionState] = useState<AuthSessionState>({
    isInitializing: true,
    isLoading: true,
    isAuthenticating: false,
    isAuthenticated: false,
    isProfileLoaded: false,
    hasError: false,
    error: null,
    retryCount: 0,
  });

  // For backward compatibility
  const enhancedStatus = mapToEnhancedStatus(status, sessionState.isProfileLoaded, !!error);
  
  // Update session state based on status
  useEffect(() => {
    setSessionState(prevState => ({
      ...prevState,
      isInitializing: status === AuthStatus.LOADING,
      isLoading: status === AuthStatus.LOADING || isLoading,
      isAuthenticating: status === AuthStatus.LOADING,
      isAuthenticated: status === AuthStatus.AUTHENTICATED,
      isProfileLoaded: status === AuthStatus.AUTHENTICATED && !isLoading,
      hasError: !!error,
      error,
    }));
  }, [status, error, isLoading]);

  // Update retry count
  useEffect(() => {
    setSessionState(prevState => ({
      ...prevState,
      retryCount,
    }));
  }, [retryCount]);

  // Attempt to retry authentication or profile loading
  const retry = async () => {
    // Increment retry count
    setRetryCount(count => count + 1);
    
    // Clear previous errors
    // We can't clear error from the previous context, but we'll overwrite with success if retry works
    
    // Try to refresh profile
    await refreshProfile();
  };

  return {
    ...sessionState,
    retry,
    enhancedStatus,
  };
}

export default useAuthSessionStatus;

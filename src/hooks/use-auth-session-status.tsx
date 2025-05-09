
import { useState, useEffect } from 'react';
import { useAuth, EnhancedAuthStatus, AuthError } from '@/context/AuthContext';

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
  const { enhancedStatus, lastError, refreshProfile, refreshSession, clearAuthError } = useAuth();
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

  // Update session state based on enhanced status
  useEffect(() => {
    setSessionState(prevState => ({
      ...prevState,
      isInitializing: enhancedStatus === EnhancedAuthStatus.INITIAL,
      isLoading: [
        EnhancedAuthStatus.INITIAL,
        EnhancedAuthStatus.SESSION_LOADING,
        EnhancedAuthStatus.PROFILE_LOADING
      ].includes(enhancedStatus),
      isAuthenticating: enhancedStatus === EnhancedAuthStatus.SESSION_LOADING,
      isAuthenticated: [
        EnhancedAuthStatus.SESSION_FOUND,
        EnhancedAuthStatus.PROFILE_LOADING,
        EnhancedAuthStatus.PROFILE_LOADED,
        EnhancedAuthStatus.PROFILE_ERROR
      ].includes(enhancedStatus),
      isProfileLoaded: enhancedStatus === EnhancedAuthStatus.PROFILE_LOADED,
      hasError: [
        EnhancedAuthStatus.AUTH_ERROR,
        EnhancedAuthStatus.TOKEN_REFRESH_ERROR,
        EnhancedAuthStatus.PROFILE_ERROR
      ].includes(enhancedStatus),
      error: lastError,
    }));
  }, [enhancedStatus, lastError]);

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
    clearAuthError();
    
    if (enhancedStatus === EnhancedAuthStatus.PROFILE_ERROR) {
      // If profile error, attempt to refresh profile
      await refreshProfile();
    } else if (enhancedStatus === EnhancedAuthStatus.TOKEN_REFRESH_ERROR) {
      // For token refresh errors, attempt to refresh the session
      await refreshSession();
    } else if (enhancedStatus === EnhancedAuthStatus.AUTH_ERROR) {
      // For general auth errors, we might need to redirect to login
      // This will be implemented in a separate component
    }
  };

  return {
    ...sessionState,
    retry,
    enhancedStatus,
  };
}

export default useAuthSessionStatus;

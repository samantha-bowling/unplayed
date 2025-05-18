
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';
import AuthSessionManager, { AuthFlowState } from '@/utils/auth/AuthSessionManager';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const {
    isLoading,
    user,
    profile,
    isAuthReady,
    refreshProfile
  } = useAuth();
  
  const location = useLocation();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] State:', {
      authReady: isAuthReady,
      loading: isLoading,
      checkingProfile: isCheckingProfile,
      hasCheckedOnboarding,
      isOnboardingComplete,
      userId: user?.id,
      profileId: profile?.id,
      retryCount,
      justLoggedIn: AuthSessionManager.hasAuthFlag('JUST_LOGGED_IN'),
      authFlowState: AuthSessionManager.getAuthFlowState(),
      path: location.pathname
    });
  }, [
    isAuthReady, isLoading, isCheckingProfile, hasCheckedOnboarding, 
    isOnboardingComplete, user?.id, profile?.id, retryCount, location.pathname
  ]);

  // Force check onboarding status when route is accessed
  useEffect(() => {
    // Only run this check when auth is ready and we have a user but haven't checked yet
    const shouldCheckProfile = 
      user && 
      isAuthReady && 
      !isCheckingProfile && 
      !hasCheckedOnboarding;
    
    if (shouldCheckProfile) {
      setIsCheckingProfile(true);
      console.log('[ProtectedRoute] Checking profile for user', user.id);
      
      // Implement exponential backoff for retries
      const performProfileCheck = async () => {
        try {
          console.log('[ProtectedRoute] Refreshing profile, attempt', retryCount + 1);
          
          const profileData = await refreshProfile();
          console.log('[ProtectedRoute] Profile check result:', profileData);
          
          // Explicit cast to boolean to avoid null/undefined confusion
          const onboardingComplete = profileData?.onboarding_complete === true;
          setIsOnboardingComplete(onboardingComplete);
          
          // If onboarding is complete, update flow status
          if (onboardingComplete) {
            AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_READY);
          } else if (profileData) {
            // We have a profile but onboarding not complete
            AuthSessionManager.setAuthFlowState(AuthFlowState.ONBOARDING_NEEDED);
          } else {
            // No profile at all
            AuthSessionManager.setAuthFlowState(AuthFlowState.PROFILE_LOADING);
          }
          
          setHasCheckedOnboarding(true);
        } catch (err) {
          console.error('[ProtectedRoute] Error checking profile:', err);
          
          // If we have a few retry attempts, try again after exponential backoff
          if (retryCount < 3) {
            // Calculate exponential backoff with jitter
            const baseDelay = 1000; // 1 second base
            const maxJitter = 500; // 0.5 seconds max jitter
            const exponentialDelay = baseDelay * Math.pow(1.5, retryCount);
            const jitter = Math.random() * maxJitter;
            const delay = exponentialDelay + jitter;
            
            console.log(`[ProtectedRoute] Retrying after ${delay.toFixed(0)}ms (attempt ${retryCount + 1}/3)`);
            
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setIsCheckingProfile(false); // Allow another attempt
            }, delay);
          } else {
            console.error('[ProtectedRoute] Max retries reached, assuming onboarding needed');
            // After retries, assume onboarding needed
            setIsOnboardingComplete(false);
            setHasCheckedOnboarding(true);
            AuthSessionManager.setAuthFlowState(AuthFlowState.ONBOARDING_NEEDED);
          }
        }
        finally {
          if (retryCount >= 3) {
            // Only clear checking state if we're done with all retries
            setIsCheckingProfile(false);
          }
        }
      };
      
      performProfileCheck();
    }
  }, [user, isAuthReady, refreshProfile, isCheckingProfile, hasCheckedOnboarding, retryCount]);
  
  // Show loading if we're checking auth or profile
  if (!isAuthReady || isLoading || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message={isCheckingProfile ? `Verifying profile (attempt ${retryCount + 1}/4)...` : "Verifying access..."} 
          size="md" 
          variant="secondary" 
        />
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    console.warn('[ProtectedRoute] No user in context, redirecting to auth');
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for required role
  if (requiredRole && profile?.role !== requiredRole) {
    console.warn(`[ProtectedRoute] User doesn't have required role: ${requiredRole}`);
    return <Navigate to="/" replace />;
  }

  // Check if onboarding is needed - this happens for cases:
  // 1. When profile exists but onboarding_complete=false
  // 2. When profile doesn't exist at all (null profile)
  if (hasCheckedOnboarding && !isOnboardingComplete) {
    console.log('[ProtectedRoute] Redirecting to welcome page for onboarding');
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

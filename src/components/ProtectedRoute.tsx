
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';
import { 
  isAuthInProgress, 
  hasSessionFlag, 
  isFromAuthCallback, 
  isRecentFirstLogin,
  getAuthFlowStatus,
  setAuthFlowStatus
} from '@/utils/auth-session-flags';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const {
    authStatus,
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
  const [lastProfileCheckTime, setLastProfileCheckTime] = useState(0);

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
      justLoggedIn: hasSessionFlag('JUST_LOGGED_IN'),
      isFromCallback: isFromAuthCallback(),
      recentFirstLogin: isRecentFirstLogin(),
      authFlowStatus: getAuthFlowStatus(),
      path: location.pathname
    });
  }, [
    isAuthReady, isLoading, isCheckingProfile, hasCheckedOnboarding, 
    isOnboardingComplete, user?.id, profile?.id, retryCount, location.pathname
  ]);

  // Force check onboarding status when route is accessed
  useEffect(() => {
    // Only run this check when auth is ready and we have a user but haven't checked yet
    // or if the auth flow is in progress and we haven't checked recently
    const now = Date.now();
    const shouldCheckProfile = 
      user && 
      isAuthReady && 
      !isCheckingProfile && 
      (!hasCheckedOnboarding || (now - lastProfileCheckTime > 3000 && isFromAuthCallback()));
    
    if (shouldCheckProfile) {
      setIsCheckingProfile(true);
      console.log('[ProtectedRoute] Checking profile for user', user.id);
      setLastProfileCheckTime(now);
      
      refreshProfile()
        .then(profileData => {
          console.log('[ProtectedRoute] Profile check result:', profileData);
          
          // Explicit cast to boolean to avoid null/undefined confusion
          const onboardingComplete = profileData?.onboarding_complete === true;
          setIsOnboardingComplete(onboardingComplete);
          
          // If onboarding is complete, update flow status
          if (onboardingComplete) {
            setAuthFlowStatus('ready');
          } else if (profileData) {
            // We have a profile but onboarding not complete
            setAuthFlowStatus('onboarding_needed');
          } else {
            // No profile at all
            setAuthFlowStatus('logged_in_waiting_profile');
          }
          
          setHasCheckedOnboarding(true);
        })
        .catch(err => {
          console.error('[ProtectedRoute] Error checking profile:', err);
          
          // If we have few retry attempts, try again after a short delay
          if (retryCount < 2) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setIsCheckingProfile(false); // Allow another attempt
            }, 1000);
          } else {
            // After retries, assume onboarding needed
            setIsOnboardingComplete(false);
            setHasCheckedOnboarding(true);
            setAuthFlowStatus('onboarding_needed');
          }
        })
        .finally(() => {
          if (retryCount >= 2 || !isAuthInProgress()) {
            setIsCheckingProfile(false);
          }
        });
    }
  }, [user, isAuthReady, refreshProfile, isCheckingProfile, hasCheckedOnboarding, retryCount, lastProfileCheckTime]);
  
  // Show loading if we're checking auth or profile
  if (!isAuthReady || isLoading || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message={isCheckingProfile ? "Verifying profile..." : "Verifying access..."} 
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

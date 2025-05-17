
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';
import { isAuthInProgress } from '@/utils/auth-session-flags';

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

  // Force check onboarding status when route is accessed
  useEffect(() => {
    // Only run this check when auth is ready and we have a user but haven't checked yet
    if (user && isAuthReady && !isCheckingProfile && !hasCheckedOnboarding && !isAuthInProgress()) {
      setIsCheckingProfile(true);
      console.log('[ProtectedRoute] Checking profile for user', user.id);
      
      refreshProfile()
        .then(profileData => {
          console.log('[ProtectedRoute] Profile check result:', profileData);
          setIsOnboardingComplete(profileData?.onboarding_complete === true);
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
            setIsOnboardingComplete(false);
            setHasCheckedOnboarding(true);
          }
        })
        .finally(() => {
          if (retryCount >= 2) {
            setIsCheckingProfile(false);
          }
        });
    }
  }, [user, isAuthReady, refreshProfile, isCheckingProfile, hasCheckedOnboarding, retryCount]);
  
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
    console.warn('👤 No user in context, redirecting to auth');
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for required role
  if (requiredRole && profile?.role !== requiredRole) {
    console.warn(`🔒 User doesn't have required role: ${requiredRole}`);
    return <Navigate to="/" replace />;
  }

  // Check if onboarding is complete after explicit check
  if (hasCheckedOnboarding && !isOnboardingComplete) {
    console.log('🔄 Redirecting to welcome page for onboarding');
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

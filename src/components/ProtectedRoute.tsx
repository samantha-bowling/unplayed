
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';

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

  // Force check onboarding status when route is accessed
  useEffect(() => {
    if (user && isAuthReady && !isCheckingProfile && !hasCheckedOnboarding) {
      setIsCheckingProfile(true);
      
      refreshProfile()
        .then(profileData => {
          setIsOnboardingComplete(profileData?.onboarding_complete === true);
          setHasCheckedOnboarding(true);
        })
        .catch(err => {
          console.error('Error checking profile for protected route:', err);
          setIsOnboardingComplete(false);
          setHasCheckedOnboarding(true);
        })
        .finally(() => {
          setIsCheckingProfile(false);
        });
    }
  }, [user, isAuthReady, refreshProfile, isCheckingProfile, hasCheckedOnboarding]);
  
  // Show loading if we're checking auth or profile
  if (!isAuthReady || isLoading || isCheckingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying access..." size="md" variant="secondary" />
      </div>
    );
  }

  if (!user) {
    console.warn('👤 No user in context');
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

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

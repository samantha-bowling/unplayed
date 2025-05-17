
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppAuthState } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';

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
    appAuthState,
    isSteamLinked
  } = useAuth();
  
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] State:', {
      authReady: isAuthReady,
      loading: isLoading,
      userId: user?.id,
      profileId: profile?.id,
      appAuthState,
      isSteamLinked,
      path: location.pathname
    });
  }, [isAuthReady, isLoading, user?.id, profile?.id, appAuthState, isSteamLinked, location.pathname]);

  // Show loading if we're checking auth or profile
  if (!isAuthReady || isLoading || appAuthState === AppAuthState.AUTHENTICATED) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message={appAuthState === AppAuthState.AUTHENTICATED ? "Verifying profile..." : "Verifying access..."} 
          size="md" 
          variant="secondary" 
        />
      </div>
    );
  }

  // If no user or anonymous state, redirect to auth
  if (!user || appAuthState === AppAuthState.ANONYMOUS) {
    console.warn('[ProtectedRoute] No user in context, redirecting to auth');
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for required role
  if (requiredRole && profile?.role !== requiredRole) {
    console.warn(`[ProtectedRoute] User doesn't have required role: ${requiredRole}`);
    return <Navigate to="/" replace />;
  }

  // Check if onboarding is needed
  if (appAuthState === AppAuthState.ONBOARDING) {
    console.log('[ProtectedRoute] Redirecting to welcome page for onboarding');
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

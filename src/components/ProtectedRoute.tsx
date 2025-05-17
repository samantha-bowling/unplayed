
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
    authIsStable,
    isSteamLinked
  } = useAuth();
  
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] State:', {
      authReady: isAuthReady,
      authStable: authIsStable,
      loading: isLoading,
      userId: user?.id,
      profileId: profile?.id,
      appAuthState,
      isSteamLinked,
      path: location.pathname
    });
  }, [isAuthReady, authIsStable, isLoading, user?.id, profile?.id, appAuthState, isSteamLinked, location.pathname]);

  // Show loading if authentication is not ready or stable yet
  if (!isAuthReady || isLoading || !authIsStable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message={`Verifying access... (${appAuthState})`} 
          size="md" 
          variant="secondary" 
        />
      </div>
    );
  }

  // Handle various app auth states
  switch (appAuthState) {
    case 'ANONYMOUS':
      console.warn('[ProtectedRoute] No user in context, redirecting to auth');
      return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
    
    case 'AUTHENTICATED':
    case 'PROFILE_LOADING':
    case 'AUTH_TRANSITIONING':
      // Still in transition, show loader
      return (
        <div className="flex items-center justify-center min-h-screen">
          <SteamLoader 
            message="Verifying profile..." 
            size="md" 
            variant="secondary" 
          />
        </div>
      );
    
    case 'ONBOARDING':
    case 'ONBOARDING_STEAM_LINK':
      console.log('[ProtectedRoute] User needs onboarding, redirecting');
      return <Navigate to="/welcome" replace />;
      
    case 'ERROR':
      console.error('[ProtectedRoute] Auth error state, redirecting to auth');
      return <Navigate to="/auth" replace />;
      
    case 'READY':
      // Check for required role
      if (requiredRole && profile?.role !== requiredRole) {
        console.warn(`[ProtectedRoute] User doesn't have required role: ${requiredRole}`);
        return <Navigate to="/" replace />;
      }
      
      // User is ready and has appropriate role if required
      return <>{children}</>;
      
    default:
      // Unexpected state, redirect to auth
      console.error(`[ProtectedRoute] Unexpected app auth state: ${appAuthState}`);
      return <Navigate to="/auth" replace />;
  }
}

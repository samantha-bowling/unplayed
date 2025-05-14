
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const {
    authStatus,
    isLoading,
    user,
    profile,
    isAuthReady,
  } = useAuth();

  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>🔄 Waiting for auth to hydrate...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>⏳ Loading session...</p>
      </div>
    );
  }

  if (!user) {
    console.warn('👤 No user in context');
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!profile?.onboarding_complete) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}


import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthStatus, EnhancedAuthStatus } from '@/context/AuthContext';
import { useAuthSessionStatus } from '@/hooks/use-auth-session-status';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { user, authStatus, profile } = useAuth();
  const { isLoading, hasError, retry, enhancedStatus } = useAuthSessionStatus();
  const location = useLocation();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isLoading) {
    return (
      <motion.div className="flex items-center justify-center min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-unplayed-mint mx-auto mb-4" />
          <div className="text-xl text-unplayed-mint">
            {enhancedStatus === EnhancedAuthStatus.PROFILE_LOADING ? 'Loading your profile...' : 'Loading your library...'}
          </div>
        </div>
      </motion.div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 terminal-container">
          <h2 className="text-xl text-unplayed-pink mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-4">
            {enhancedStatus === EnhancedAuthStatus.PROFILE_ERROR
              ? "We couldn't load your profile data."
              : enhancedStatus === EnhancedAuthStatus.TOKEN_REFRESH_ERROR
              ? "Your session has expired."
              : "There was a problem with your authentication."}
          </p>
          <Button onClick={retry} className="w-full mb-4 bg-unplayed-mint text-black hover:bg-unplayed-mint/80">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
          <a href="/auth" className="btn-primary block text-center">Return to Sign In</a>
        </div>
      </div>
    );
  }

  if (authStatus === AuthStatus.UNAUTHENTICATED || !user) {
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin') {
    if (isDevelopment) {
      return (
        <div>
          <div className="bg-amber-900/50 border border-amber-700 text-amber-200 p-2 text-center text-sm">
            <AlertTriangle className="inline-block mr-2 h-4 w-4" />
            Developer Tool - This page would be restricted in production
          </div>
          {children}
        </div>
      );
    }

    const isAdmin = user?.user_metadata?.role === 'admin';
    if (!isAdmin) return <Navigate to="/" replace />;
  }

  // ⛔️ User is authenticated but hasn’t linked Steam
  if (!profile?.steam_id) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;


import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthStatus } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string; // For future role-based access control
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  if (authStatus === AuthStatus.LOADING) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-unplayed-mint mx-auto mb-4" />
          <div className="text-xl text-unplayed-mint">
            Loading your library...
          </div>
        </div>
      </motion.div>
    );
  }

  if (authStatus === AuthStatus.ERROR) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 terminal-container">
          <h2 className="text-xl text-unplayed-pink mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-4">
            There was a problem verifying your session. Please try signing in again.
          </p>
          <a href="/auth" className="btn-primary">
            Return to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (authStatus === AuthStatus.UNAUTHENTICATED || !user) {
    // Save the current location to redirect back after login
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />;
  }

  // Add future role-based access control here
  
  return <>{children}</>;
};

export default ProtectedRoute;

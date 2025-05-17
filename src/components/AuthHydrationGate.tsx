
import { ReactNode } from 'react';
import { useAuth, AppAuthState } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';

/**
 * AuthHydrationGate prevents the application from rendering until
 * authentication state has stabilized to prevent flickering and
 * inconsistent UI states during auth transitions.
 */
export const AuthHydrationGate = ({ children }: { children: ReactNode }) => {
  const { appAuthState, isAuthReady } = useAuth();
  
  // Define states that are considered stable for rendering the application
  const safeStates: AppAuthState[] = [
    'READY', 
    'ONBOARDING', 
    'ANONYMOUS'
  ];
  
  // Show loading state until auth is ready and in a safe state
  if (!isAuthReady || !safeStates.includes(appAuthState)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader 
          message={`Preparing your experience... (${appAuthState})`}
          size="md" 
          variant="secondary" 
        />
      </div>
    );
  }

  // Auth is ready and in a safe state, render the app
  return <>{children}</>;
};

export default AuthHydrationGate;

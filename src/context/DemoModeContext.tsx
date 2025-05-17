
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';
import { isAuthInProgress } from '@/utils/auth-session-flags';

interface DemoModeContextType {
  isDemo: boolean;
  isDemoExplicit: boolean;
  setIsDemoExplicit: (value: boolean) => void;
  demoData: DemoDataType;
  enableDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create state first, before attempting to access AuthContext
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  const [stableIsDemoState, setStableIsDemoState] = useState(false);
  const [demoStateChangeTimer, setDemoStateChangeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Safely access AuthContext - might be null initially if order is wrong
  const authContext = useContext(AuthContext);
  
  // Use effects to react to auth changes only when context is available
  useEffect(() => {
    // Skip this effect if auth context isn't available yet
    if (!authContext) {
      console.log('Auth context not available yet, demo mode remains unchanged');
      return;
    }
    
    const { user, isLoading } = authContext;
    
    // Always prevent demo mode changes during active authentication
    if (isAuthInProgress()) {
      console.log('Auth in progress, stabilizing demo state');
      return;
    }
    
    // Determine the target demo state with clear rules
    const targetDemoState = (!isLoading && !user) || isDemoExplicit;
    
    // Only update if the state actually needs to change - prevents cycles
    if (targetDemoState !== stableIsDemoState) {
      console.log(`Scheduling demo state update (${stableIsDemoState} → ${targetDemoState})`);
      console.log(`Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
      
      // Cancel any existing timer to prevent race conditions
      if (demoStateChangeTimer) {
        clearTimeout(demoStateChangeTimer);
      }
      
      // Use a longer delay for more stability during transitions
      const timer = setTimeout(() => {
        console.log(`Setting stable demo state: ${targetDemoState}`);
        setStableIsDemoState(targetDemoState);
      }, 300);
      
      setDemoStateChangeTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [authContext, isDemoExplicit, stableIsDemoState, demoStateChangeTimer]);
  
  // Enhanced logging to help debug auth and demo mode state changes
  useEffect(() => {
    if (!authContext) {
      console.log('Demo mode: provider mounted, waiting for auth context');
      return;
    }
    
    const { isLoading, user } = authContext;
    console.log(`Demo mode: ${stableIsDemoState ? 'enabled' : 'disabled'}, Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}, Auth in progress: ${isAuthInProgress()}`);
  }, [stableIsDemoState, authContext, isDemoExplicit]);
  
  const enableDemo = () => {
    console.log('Demo mode explicitly enabled');
    setIsDemoExplicit(true);
  };
  
  return (
    <DemoModeContext.Provider value={{ 
      isDemo: stableIsDemoState,
      isDemoExplicit, 
      setIsDemoExplicit,
      demoData: DEMO_DATA,
      enableDemo
    }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
};

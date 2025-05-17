
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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
  const { user, isLoading } = useAuth();
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  const [stableIsDemoState, setStableIsDemoState] = useState(false);
  const [demoStateChangeTimer, setDemoStateChangeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Enhanced logic with debounce to prevent state thrashing during auth transitions
  useEffect(() => {
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
  }, [isLoading, user, isDemoExplicit, stableIsDemoState, demoStateChangeTimer]);
  
  // Enhanced logging to help debug auth and demo mode state changes
  useEffect(() => {
    console.log(`Demo mode: ${stableIsDemoState ? 'enabled' : 'disabled'}, Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}, Auth in progress: ${isAuthInProgress()}`);
  }, [stableIsDemoState, isLoading, user, isDemoExplicit]);
  
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

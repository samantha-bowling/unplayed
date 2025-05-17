
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';
import { isAuthInProgress, getAuthFlowStatus } from '@/utils/auth-session-flags';

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
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Safely access AuthContext - might be null initially if order is wrong
  const authContext = useContext(AuthContext);
  
  // Track hydration state to prevent flickering
  useEffect(() => {
    if (!authContext) return;
    
    const { isAuthReady, user, isLoading } = authContext;
    
    // Only mark as hydrated when auth is ready and not loading
    if (isAuthReady && !isLoading) {
      console.log('[DemoMode] Auth context hydrated');
      
      // Small delay to ensure stability
      setTimeout(() => {
        setIsHydrated(true);
      }, 100);
    }
  }, [authContext]);
  
  // Use effects to react to auth changes only when context is available and hydrated
  useEffect(() => {
    // Skip this effect if auth context isn't available yet or not hydrated
    if (!authContext || !isHydrated) {
      if (!authContext) {
        console.log('[DemoMode] Auth context not available yet, demo mode remains unchanged');
      } else if (!isHydrated) {
        console.log('[DemoMode] Auth not fully hydrated yet, waiting');
      }
      return;
    }
    
    const { user, isLoading } = authContext;
    
    // Always prevent demo mode changes during active authentication
    if (isAuthInProgress()) {
      console.log('[DemoMode] Auth in progress, stabilizing demo state');
      return;
    }
    
    // Get the current auth flow status
    const authFlowStatus = getAuthFlowStatus();
    if (authFlowStatus !== 'ready' && authFlowStatus !== 'initializing') {
      console.log(`[DemoMode] Auth flow in status ${authFlowStatus}, stabilizing demo state`);
      return;
    }
    
    // Determine the target demo state with clear rules
    const targetDemoState = (!isLoading && !user) || isDemoExplicit;
    
    // Only update if the state actually needs to change - prevents cycles
    if (targetDemoState !== stableIsDemoState) {
      console.log(`[DemoMode] Scheduling demo state update (${stableIsDemoState} → ${targetDemoState})`);
      console.log(`[DemoMode] Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
      
      // Cancel any existing timer to prevent race conditions
      if (demoStateChangeTimer) {
        clearTimeout(demoStateChangeTimer);
      }
      
      // Use a longer delay for more stability during transitions
      const timer = setTimeout(() => {
        console.log(`[DemoMode] Setting stable demo state: ${targetDemoState}`);
        setStableIsDemoState(targetDemoState);
      }, 500);
      
      setDemoStateChangeTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [authContext, isDemoExplicit, stableIsDemoState, demoStateChangeTimer, isHydrated]);
  
  // Enhanced logging to help debug auth and demo mode state changes
  useEffect(() => {
    if (!authContext) {
      console.log('[DemoMode] Provider mounted, waiting for auth context');
      return;
    }
    
    const { isLoading, user, isAuthReady } = authContext;
    console.log(`[DemoMode] Demo state: ${stableIsDemoState ? 'enabled' : 'disabled'}, Auth ready: ${isAuthReady}, Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}, Auth in progress: ${isAuthInProgress()}, Is hydrated: ${isHydrated}`);
  }, [stableIsDemoState, authContext, isDemoExplicit, isHydrated]);
  
  const enableDemo = () => {
    console.log('[DemoMode] Demo mode explicitly enabled');
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


import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './auth/hook';
import { AppAuthState } from './auth/types';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';

interface DemoModeContextType {
  isDemo: boolean;
  isDemoExplicit: boolean;
  setIsDemoExplicit: (value: boolean) => void;
  demoData: DemoDataType;
  enableDemo: () => void;
  disableDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create state for explicit demo mode toggle (used for testing)
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  
  // Safely access AuthContext
  const authContext = useContext(useAuth());
  
  // Compute if we should show demo mode based on the new AppAuthState and authIsStable
  // This provides more stable transitions between states
  const isDemo = useMemo(() => {
    // If explicitly in demo mode, use that
    if (isDemoExplicit) return true;
    
    // If AuthContext isn't available or not ready yet, default to demo mode
    if (!authContext || !authContext.isAuthReady) return true;
    
    // Use the improved authIsStable flag and appAuthState
    if (authContext.authIsStable) {
      // If we have a full authenticated user with completed profile, disable demo mode
      if (authContext.appAuthState === 'READY') return false;
    }
    
    // In all other states, show demo mode
    return true;
  }, [authContext?.appAuthState, authContext?.authIsStable, authContext?.isAuthReady, isDemoExplicit]);
  
  // Debug logging
  useEffect(() => {
    if (authContext && authContext.isAuthReady) {
      console.log(`[DemoMode] Demo state: ${isDemo ? 'enabled' : 'disabled'}, Auth ready: ${authContext.isAuthReady}, Auth state: ${authContext.appAuthState}, User: ${authContext.user ? authContext.user.id : 'none'}, Steam linked: ${authContext.isSteamLinked}, Explicit demo: ${isDemoExplicit}, Auth stable: ${authContext.authIsStable || false}`);
    }
  }, [isDemo, authContext, isDemoExplicit]);
  
  // When user completes onboarding, disable explicit demo mode
  useEffect(() => {
    if (authContext?.appAuthState === 'READY' && isDemoExplicit) {
      console.log('[DemoMode] User fully authenticated, disabling explicit demo mode');
      setIsDemoExplicit(false);
    }
  }, [authContext?.appAuthState, isDemoExplicit]);
  
  const enableDemo = () => {
    console.log('[DemoMode] Demo mode explicitly enabled');
    setIsDemoExplicit(true);
  };
  
  const disableDemo = () => {
    console.log('[DemoMode] Demo mode explicitly disabled');
    setIsDemoExplicit(false);
  };
  
  // Create a stable context value object
  const contextValue = useMemo(() => ({
    isDemo,
    isDemoExplicit, 
    setIsDemoExplicit,
    demoData: DEMO_DATA,
    enableDemo,
    disableDemo
  }), [isDemo, isDemoExplicit]);
  
  return (
    <DemoModeContext.Provider value={contextValue}>
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

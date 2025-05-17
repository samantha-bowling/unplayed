import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';

interface DemoModeContextType {
  isDemo: boolean;
  isDemoExplicit: boolean;
  setIsDemoExplicit: (value: boolean) => void;
  demoData: DemoDataType;
  enableDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create state for explicit demo mode toggle (used for testing)
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  
  // Safely access AuthContext
  const authContext = useContext(AuthContext);
  
  // Compute if we should show demo mode - only compute this once auth is ready
  // Simple rule: Demo mode is active if user is not authenticated OR explicitly enabled
  const isDemo = useMemo(() => {
    // If AuthContext isn't available or not ready yet, default to demo mode
    if (!authContext || !authContext.isAuthReady) return true;
    
    // If explicitly in demo mode, use that
    if (isDemoExplicit) return true;
    
    // Otherwise, demo mode if no authenticated user
    return !authContext.user;
  }, [authContext, isDemoExplicit]);
  
  // Debug logging
  useEffect(() => {
    if (authContext && authContext.isAuthReady) {
      console.log(`[DemoMode] Demo state: ${isDemo ? 'enabled' : 'disabled'}, Auth ready: ${authContext.isAuthReady}, Auth loading: ${authContext.isLoading}, User: ${authContext.user ? authContext.user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
    }
  }, [isDemo, authContext, isDemoExplicit]);
  
  const enableDemo = () => {
    console.log('[DemoMode] Demo mode explicitly enabled');
    setIsDemoExplicit(true);
  };
  
  // Create a stable context value object
  const contextValue = useMemo(() => ({
    isDemo,
    isDemoExplicit, 
    setIsDemoExplicit,
    demoData: DEMO_DATA,
    enableDemo
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

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';

interface DemoModeContextType {
  isDemo: boolean;
  isDemoExplicit: boolean;
  setIsDemoExplicit: (value: boolean) => void;
  demoData: DemoDataType;
  enableDemo: () => void;
  disableDemo: () => void; // New function to explicitly disable demo mode
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create state for explicit demo mode toggle (used for testing)
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  
  // Get auth context
  const { user, isAuthReady, profile } = useAuth();
  
  // Compute if we should show demo mode - only compute this once auth is ready
  // Show demo mode if:
  // 1. User explicitly enabled demo mode, OR
  // 2. No authenticated user, OR
  // 3. User is authenticated but has no Steam account linked
  const isDemo = useMemo(() => {
    // If explicitly in demo mode, use that
    if (isDemoExplicit) return true;
    
    // If auth context isn't available or not ready yet, default to demo mode
    if (!isAuthReady) return true;
    
    // If no user, show demo mode
    if (!user) return true;
    
    // If user has no Steam account linked, show demo mode
    if (user && profile && !profile.steam_id) return true;
    
    // Otherwise, don't show demo mode
    return false;
  }, [user, isAuthReady, isDemoExplicit, profile]);
  
  // Debug logging
  useEffect(() => {
    if (isAuthReady) {
      console.log(`[DemoMode] Status: ${isDemo ? 'enabled' : 'disabled'}, Auth ready: ${isAuthReady}, User: ${user ? user.id : 'none'}, Steam linked: ${profile?.steam_id ? 'yes' : 'no'}, Explicit demo: ${isDemoExplicit}`);
    }
  }, [isDemo, isAuthReady, user, profile, isDemoExplicit]);
  
  // When user logs in and has Steam linked, disable explicit demo mode
  useEffect(() => {
    if (user && profile?.steam_id && isDemoExplicit) {
      console.log('[DemoMode] User authenticated with Steam linked, disabling explicit demo mode');
      setIsDemoExplicit(false);
    }
  }, [user, profile?.steam_id, isDemoExplicit]);
  
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

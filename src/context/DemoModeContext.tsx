
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Safely access AuthContext
  const authContext = useContext(AuthContext);
  
  // Track hydration state to prevent flickering
  useEffect(() => {
    if (!authContext) return;
    
    const { isAuthReady, isLoading } = authContext;
    
    // Only mark as hydrated when auth is ready and not loading
    if (isAuthReady && !isLoading) {
      console.log('[DemoMode] Auth context hydrated');
      setIsHydrated(true);
    }
  }, [authContext]);
  
  // Compute if we should show demo mode
  // Simple rule: Demo mode is active if user is not authenticated OR explicitly enabled
  const isDemo = Boolean(
    (isHydrated && authContext && !authContext.user) || isDemoExplicit
  );
  
  useEffect(() => {
    if (authContext && isHydrated) {
      console.log(`[DemoMode] Demo state: ${isDemo ? 'enabled' : 'disabled'}, Auth ready: ${authContext.isAuthReady}, Auth loading: ${authContext.isLoading}, User: ${authContext.user ? authContext.user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
    }
  }, [isDemo, authContext, isDemoExplicit, isHydrated]);
  
  const enableDemo = () => {
    console.log('[DemoMode] Demo mode explicitly enabled');
    setIsDemoExplicit(true);
  };
  
  return (
    <DemoModeContext.Provider value={{ 
      isDemo,
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

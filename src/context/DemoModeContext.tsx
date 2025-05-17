
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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
  const { user, isLoading } = useAuth();
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  const [stableIsDemoState, setStableIsDemoState] = useState(false);
  
  // Check if auth is in progress to prevent flickering
  const isAuthInProgress = () => {
    return sessionStorage.getItem('authInProgress') === 'true' || 
           sessionStorage.getItem('authStarted') === 'true';
  };
  
  // Enhanced logic: Always consider auth loading state and in-progress states first
  // This prevents the race condition where demo mode is enabled during auth loading
  useEffect(() => {
    // Don't change demo state during auth transitions
    if (isAuthInProgress()) {
      console.log('Auth in progress, not changing demo state');
      return;
    }
    
    // Determine the stable demo state with debounce
    const newDemoState = (!isLoading && !user) || isDemoExplicit;
    
    // Only update if the state actually changed
    if (newDemoState !== stableIsDemoState) {
      console.log(`Setting stable demo state: ${newDemoState}, Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
      
      // Use a slight delay to prevent rapid flickering
      const timer = setTimeout(() => {
        setStableIsDemoState(newDemoState);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, isDemoExplicit, stableIsDemoState]);
  
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

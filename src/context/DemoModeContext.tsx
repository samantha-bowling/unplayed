
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
  
  // Enhanced logic: Always consider auth loading state first
  // This prevents the race condition where demo mode is enabled during auth loading
  const isDemo = (!isLoading && !user) || isDemoExplicit;
  
  // Enhanced logging to help debug auth and demo mode state changes
  useEffect(() => {
    console.log(`Demo mode: ${isDemo ? 'enabled' : 'disabled'}, Auth loading: ${isLoading}, User: ${user ? user.id : 'none'}, Explicit demo: ${isDemoExplicit}`);
  }, [isDemo, isLoading, user, isDemoExplicit]);
  
  const enableDemo = () => {
    console.log('Demo mode explicitly enabled');
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

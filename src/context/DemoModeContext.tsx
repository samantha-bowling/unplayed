
import React, { createContext, useContext, useState } from 'react';
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
  
  // Only consider user logged out after authentication has finished loading
  // This fixes the race condition where demo mode is enabled during auth loading
  const isDemo = (isLoading ? false : !user) || isDemoExplicit;
  
  const enableDemo = () => {
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


import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';

interface DemoModeContextType {
  isDemo: boolean;
  isDemoExplicit: boolean;
  setIsDemoExplicit: (value: boolean) => void;
  demoData: DemoDataType;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  
  // When not logged in, isDemo is always true
  // When logged in, isDemo depends on user preference
  const isDemo = !user || isDemoExplicit;
  
  return (
    <DemoModeContext.Provider value={{ 
      isDemo, 
      isDemoExplicit, 
      setIsDemoExplicit,
      demoData: DEMO_DATA
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

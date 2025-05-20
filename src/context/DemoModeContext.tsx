
// src/context/DemoModeContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEMO_DATA, DemoDataType } from '@/lib/demo-data';

type DemoModeContextType = {
  isDemo: boolean;
  isDemoExplicit: boolean;
  demoData: DemoDataType;
  enableDemo: () => void;
  disableDemo: () => void;
  setIsDemoExplicit: (isDemoExplicit: boolean) => void;
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  const [demoData, setDemoData] = useState(DEMO_DATA);
  const { status, isLoading } = useAuth();

  const enableDemo = useCallback(() => {
    setIsDemo(true);
    setIsDemoExplicit(true);
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemo(false);
    setIsDemoExplicit(false);
  }, []);

  useEffect(() => {
    // Enable demo mode by default if not authenticated
    if (status === 'UNAUTHENTICATED') {
      setIsDemo(true);
      setIsDemoExplicit(false);
    } else {
      setIsDemo(isDemoExplicit);
    }
  }, [status, isDemoExplicit]);

  const contextValue: DemoModeContextType = {
    isDemo,
    isDemoExplicit,
    demoData,
    enableDemo,
    disableDemo,
    setIsDemoExplicit,
  };

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

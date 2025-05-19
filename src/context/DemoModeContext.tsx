// src/context/DemoModeContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useAuth } from '@/context/AuthContext';

type DemoModeContextType = {
  isDemo: boolean;
  isDemoExplicit: boolean;
  demoData: any;
  enableDemo: () => void;
  disableDemo: () => void;
  setIsDemoExplicit: (isDemoExplicit: boolean) => void;
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const initialDemoData = {
  unplayedGames: 420,
  dustScore: 69,
  totalSpent: 1337,
  genreHoarding: [
    { genre: 'RPG', count: 69 },
    { genre: 'Action', count: 42 },
    { genre: 'Adventure', count: 21 },
  ],
  shelfLife: [
    { year: 2018, count: 12 },
    { year: 2019, count: 24 },
    { year: 2020, count: 36 },
  ],
  libraryPreview: [
    { name: 'Game 1', img: 'https://via.placeholder.com/50' },
    { name: 'Game 2', img: 'https://via.placeholder.com/50' },
    { name: 'Game 3', img: 'https://via.placeholder.com/50' },
  ],
};

export const DemoModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [isDemoExplicit, setIsDemoExplicit] = useState(false);
  const [demoData, setDemoData] = useState(initialDemoData);
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

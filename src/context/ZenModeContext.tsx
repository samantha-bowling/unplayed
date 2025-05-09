
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available components for zen mode focus
export type FocusableComponent = 'library' | 'picker' | null;

interface ZenModeContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
  focusedComponent: FocusableComponent;
  setFocusedComponent: (component: FocusableComponent) => void;
  enterZenMode: (component: FocusableComponent) => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export const ZenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isZenMode, setIsZenMode] = useState(false);
  const [focusedComponent, setFocusedComponent] = useState<FocusableComponent>(null);

  const toggleZenMode = () => {
    setIsZenMode(prev => !prev);
    if (isZenMode) setFocusedComponent(null); // Clear focused component when exiting zen mode
  };
  
  const enterZenMode = (component: FocusableComponent) => {
    setIsZenMode(true);
    setFocusedComponent(component);
  };

  // Handle keyboard shortcut (Ctrl + Shift + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        toggleZenMode();
        e.preventDefault(); // Prevent browser default action
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ZenModeContext.Provider value={{ 
      isZenMode, 
      toggleZenMode, 
      focusedComponent, 
      setFocusedComponent,
      enterZenMode 
    }}>
      {children}
    </ZenModeContext.Provider>
  );
};

export const useZenMode = () => {
  const context = useContext(ZenModeContext);
  if (context === undefined) {
    throw new Error("useZenMode must be used within a ZenModeProvider");
  }
  return context;
};

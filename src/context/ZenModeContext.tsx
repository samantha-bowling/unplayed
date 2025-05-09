
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ZenModeContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export const ZenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleZenMode = () => {
    setIsZenMode(prev => !prev);
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
    <ZenModeContext.Provider value={{ isZenMode, toggleZenMode }}>
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

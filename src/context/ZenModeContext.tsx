
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available components for zen mode focus
export type FocusableComponent = 'library' | 'picker' | null;

// Define types for component-specific settings
type ComponentSettings = {
  library?: {
    viewMode?: 'grid' | 'zen'
  },
  picker?: {
    // Add picker-specific settings here in the future if needed
  }
};

interface ZenModeContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
  focusedComponent: FocusableComponent;
  setFocusedComponent: (component: FocusableComponent) => void;
  enterZenMode: (component: FocusableComponent, settings?: any) => void;
  componentSettings: ComponentSettings;
  updateComponentSettings: (component: FocusableComponent, settings: any) => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export const ZenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isZenMode, setIsZenMode] = useState(false);
  const [focusedComponent, setFocusedComponent] = useState<FocusableComponent>(null);
  const [componentSettings, setComponentSettings] = useState<ComponentSettings>({});

  const toggleZenMode = () => {
    setIsZenMode(prev => !prev);
    if (isZenMode) setFocusedComponent(null); // Clear focused component when exiting zen mode
  };
  
  const enterZenMode = (component: FocusableComponent, settings?: any) => {
    setIsZenMode(true);
    setFocusedComponent(component);
    
    // If settings are provided, update them for the component
    if (settings && component) {
      updateComponentSettings(component, settings);
    }
  };
  
  const updateComponentSettings = (component: FocusableComponent, settings: any) => {
    if (!component) return;
    
    setComponentSettings(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        ...settings
      }
    }));
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
      enterZenMode,
      componentSettings,
      updateComponentSettings 
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

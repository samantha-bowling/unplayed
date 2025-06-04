
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available components for full screen mode focus
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

interface FullScreenModeContextType {
  isFullScreenMode: boolean;
  toggleFullScreenMode: () => void;
  setFullScreenMode: (enabled: boolean) => void;
  focusedComponent: FocusableComponent;
  setFocusedComponent: (component: FocusableComponent) => void;
  enterFullScreenMode: (component: FocusableComponent, settings?: any) => void;
  componentSettings: ComponentSettings;
  updateComponentSettings: (component: FocusableComponent, settings: any) => void;
}

const FullScreenModeContext = createContext<FullScreenModeContextType | undefined>(undefined);

export const FullScreenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);
  const [focusedComponent, setFocusedComponent] = useState<FocusableComponent>(null);
  const [componentSettings, setComponentSettings] = useState<ComponentSettings>({
    library: { viewMode: 'grid' }, // Default value
    picker: {}
  });

  const toggleFullScreenMode = () => {
    setIsFullScreenMode(prev => !prev);
    if (isFullScreenMode) setFocusedComponent(null); // Clear focused component when exiting full screen mode
  };

  const setFullScreenMode = (enabled: boolean) => {
    setIsFullScreenMode(enabled);
    if (!enabled) setFocusedComponent(null);
  };
  
  const enterFullScreenMode = (component: FocusableComponent, settings?: any) => {
    setIsFullScreenMode(true);
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
        toggleFullScreenMode();
        e.preventDefault(); // Prevent browser default action
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <FullScreenModeContext.Provider value={{ 
      isFullScreenMode, 
      toggleFullScreenMode,
      setFullScreenMode,
      focusedComponent, 
      setFocusedComponent,
      enterFullScreenMode,
      componentSettings,
      updateComponentSettings 
    }}>
      {children}
    </FullScreenModeContext.Provider>
  );
};

export const useFullScreenMode = () => {
  const context = useContext(FullScreenModeContext);
  if (context === undefined) {
    throw new Error("useFullScreenMode must be used within a FullScreenModeProvider");
  }
  return context;
};

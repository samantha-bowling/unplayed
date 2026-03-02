
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { useFullScreenMode } from '@/context/FullScreenModeContext';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeaderInFullScreen?: boolean;
}

/**
 * Main application layout
 * Includes header, footer and full-screen mode support
 */
const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showHeaderInFullScreen = false 
}) => {
  const { isFullScreenMode } = useFullScreenMode();
  
  // In full screen mode, render only the content unless explicitly asked to show header
  if (isFullScreenMode && !showHeaderInFullScreen) {
    return (
      <FullScreenModeWrapper>
        <div className="min-h-screen">
          {children}
        </div>
      </FullScreenModeWrapper>
    );
  }

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main id="main-content" className="flex-grow px-4 py-8 header-spacing">
          {children}
        </main>
        
        <Footer />
      </div>
    </FullScreenModeWrapper>
  );
};

export default MainLayout;

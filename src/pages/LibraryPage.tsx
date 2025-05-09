
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ZenModeWrapper from '@/components/ZenModeWrapper';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useZenMode } from '@/context/ZenModeContext';
import LibraryPreview from '@/components/LibraryPreview';

const LibraryPage: React.FC = () => {
  const { isZenMode, componentSettings } = useZenMode();

  // In Zen Mode, render only the LibraryPreview component
  if (isZenMode) {
    return (
      <ZenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <LibraryPreview zenModeFullScreen={true} />
        </div>
      </ZenModeWrapper>
    );
  }

  // Regular view with header and footer
  return (
    <ZenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold font-space mb-6">
              <span className="text-unplayed-mint">Library</span>
              <span className="text-white">.exe</span>
            </h1>
            
            <LibraryPreview />
          </div>
        </main>
        
        <Footer />
      </div>
    </ZenModeWrapper>
  );
};

export default withDemoIndicator(LibraryPage);

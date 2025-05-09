
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ZenModeWrapper from '@/components/ZenModeWrapper';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useZenMode } from '@/context/ZenModeContext';

const LibraryPage: React.FC = () => {
  const { isZenMode } = useZenMode();

  return (
    <ZenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className={`text-3xl font-bold font-space mb-6 ${isZenMode ? 'text-center' : ''}`}>
              <span className="text-unplayed-mint">Library</span>
              <span className="text-white">.exe</span>
            </h1>
            
            <div className="terminal-container p-4">
              <p className="text-gray-300">
                Library page implementation in progress. Check back soon!
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ZenModeWrapper>
  );
};

export default withDemoIndicator(LibraryPage);


import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ZenModeWrapper from '@/components/ZenModeWrapper';
import RandomPicker from '@/components/RandomPicker';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useZenMode } from '@/context/ZenModeContext';

const PickerPage: React.FC = () => {
  const { isZenMode } = useZenMode();

  // In Zen Mode, render only the RandomPicker component
  if (isZenMode) {
    return (
      <ZenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <RandomPicker fullScreen={true} />
        </div>
      </ZenModeWrapper>
    );
  }

  return (
    <ZenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8 header-spacing">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold font-space mb-6">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h1>
            
            <RandomPicker />
          </div>
        </main>
        
        <Footer />
      </div>
    </ZenModeWrapper>
  );
};

export default withDemoIndicator(PickerPage);

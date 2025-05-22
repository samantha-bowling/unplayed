
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout, FullScreenLayout } from '@/layouts';
import RandomPicker from '@/components/RandomPicker';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import useUnplayedData from '@/hooks/use-unplayed-data';
import { PickerNavigationState } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';

const PickerPage: React.FC = () => {
  const { isFullScreenMode } = useFullScreenMode();
  const { data: unplayedData } = useUnplayedData();
  const location = useLocation();
  
  // Extract navigation state if available
  const navigationState = location.state as PickerNavigationState | null;
  
  // Notify user when navigating from another component with filters
  useEffect(() => {
    if (navigationState?.source) {
      let message = '';
      
      switch (navigationState.source) {
        case 'genre':
          message = `Filtering games from genre: ${navigationState.genre}`;
          break;
        case 'shelfLife':
          message = 'Picking from your oldest games';
          break;
        case 'library':
          message = 'Using filters from library';
          break;
      }
      
      if (message) {
        toast({
          title: "Filters Applied",
          description: message,
        });
      }
    }
  }, [navigationState]);

  // In Full Screen Mode, use the FullScreenLayout instead of MainLayout
  if (isFullScreenMode) {
    return (
      <FullScreenLayout>
        <RandomPicker 
          fullScreen={true} 
          initialFilters={navigationState}
        />
      </FullScreenLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold font-space mb-6">
          <span className="text-unplayed-amber">Picker</span>
          <span className="text-white">.exe</span>
        </h1>
        
        <RandomPicker initialFilters={navigationState} />
      </div>
    </MainLayout>
  );
};

export default withDemoIndicator(PickerPage);

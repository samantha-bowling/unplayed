
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/context/DemoModeContext';
import { Button } from '@/components/ui/button';

const DemoModeFallback: React.FC = () => {
  const navigate = useNavigate();
  const { enableDemo } = useDemoMode();
  
  const handleDemoMode = () => {
    enableDemo();
    navigate('/'); // Changed from '/library' to '/' (homepage)
  };
  
  return (
    <div className="mt-6 p-4 border border-dashed border-gray-600 rounded-md text-center">
      <h4 className="text-sm font-medium text-gray-400 mb-2">Not ready to change your settings?</h4>
      <p className="text-xs text-gray-500 mb-3">
        You can still explore unplayed with example data to see how it works.
      </p>
      <Button 
        variant="ghost" 
        onClick={handleDemoMode}
        size="sm"
        className="text-unplayed-pink hover:text-unplayed-pink hover:bg-unplayed-pink/10"
      >
        Try unplayed in Demo Mode
      </Button>
    </div>
  );
};

export default DemoModeFallback;

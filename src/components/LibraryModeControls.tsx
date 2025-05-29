
import React from 'react';
import { Button } from '@/components/ui/button';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';

interface LibraryModeControlsProps {
  usePagination: boolean;
  onModeChange: (usePagination: boolean) => void;
}

const LibraryModeControls: React.FC<LibraryModeControlsProps> = ({
  usePagination,
  onModeChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        size="sm" 
        variant={usePagination ? "default" : "outline"}
        onClick={() => onModeChange(true)}
        className={usePagination ? "bg-unplayed-amber/80 hover:bg-unplayed-amber" : ""}
      >
        Optimized Mode
      </Button>
      <Button 
        size="sm" 
        variant={!usePagination ? "default" : "outline"}
        onClick={() => onModeChange(false)}
        className={!usePagination ? "bg-unplayed-amber/80 hover:bg-unplayed-amber" : ""}
      >
        Legacy Mode
      </Button>
      <FullScreenModeToggle />
    </div>
  );
};

export default LibraryModeControls;

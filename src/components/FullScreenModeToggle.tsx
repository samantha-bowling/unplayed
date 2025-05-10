
import React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FullScreenModeToggle: React.FC = () => {
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullScreenMode}
            className="bg-black/50 border-gray-700 hover:bg-black/70"
          >
            {isFullScreenMode ? (
              <Minimize size={18} />
            ) : (
              <Maximize size={18} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFullScreenMode ? 'Exit Full Screen Mode (Ctrl+Shift+Z)' : 'Enter Full Screen Mode (Ctrl+Shift+Z)'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FullScreenModeToggle;


import React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ZenModeToggle: React.FC = () => {
  const { isZenMode, toggleZenMode } = useZenMode();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleZenMode}
            className="relative h-8 w-8 text-unplayed-mint hover:text-unplayed-mint/80"
          >
            {isZenMode ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isZenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isZenMode ? 'Exit Zen Mode (Ctrl+Shift+Z)' : 'Enter Zen Mode (Ctrl+Shift+Z)'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ZenModeToggle;

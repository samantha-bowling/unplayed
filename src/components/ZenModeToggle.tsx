import React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const ZenModeToggle: React.FC = () => {
  const {
    isZenMode,
    toggleZenMode
  } = useZenMode();
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          
        </TooltipTrigger>
        <TooltipContent>
          <p>{isZenMode ? 'Exit Zen Mode (Ctrl+Shift+Z)' : 'Enter Zen Mode (Ctrl+Shift+Z)'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};
export default ZenModeToggle;
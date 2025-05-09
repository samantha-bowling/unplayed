
import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface WithDemoProps {
  isDemo?: boolean;
}

export function withDemoIndicator<T extends WithDemoProps>(
  Component: React.ComponentType<T>
) {
  return (props: Omit<T, 'isDemo'>) => {
    const { isDemo } = useDemoMode();
    
    return (
      <div className="relative">
        {isDemo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                className="absolute top-2 right-2 z-10 bg-unplayed-amber/70 text-black hover:bg-unplayed-amber/90"
                variant="outline"
              >
                Example Data
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-black text-unplayed-amber border-unplayed-amber/30">
              This is example data. Connect your Steam account to see your real stats.
            </TooltipContent>
          </Tooltip>
        )}
        <Component {...(props as T)} isDemo={isDemo} />
      </div>
    );
  };
}

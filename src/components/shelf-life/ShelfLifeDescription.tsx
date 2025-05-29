
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

const ShelfLifeDescription: React.FC = () => {
  return (
    <div className="flex items-center mb-4">
      <p className="text-sm text-gray-400">
        Oldest Released Games Still Unplayed
      </p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-2 text-gray-500 hover:text-gray-400">
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-sm">These games were released the longest ago but you still haven't played them.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ShelfLifeDescription;

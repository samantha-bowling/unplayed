
import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface PreviouslyPickedBadgeProps {
  pickedAt: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Badge to indicate a game has been previously picked
 * Shows the date it was last picked when hovered
 */
const PreviouslyPickedBadge: React.FC<PreviouslyPickedBadgeProps> = ({ 
  pickedAt,
  position = 'top-right'
}) => {
  // Convert position to appropriate Tailwind classes
  const positionClasses = {
    'top-right': 'top-1 right-1',
    'top-left': 'top-1 left-1',
    'bottom-right': 'bottom-1 right-1',
    'bottom-left': 'bottom-1 left-1'
  };

  // Format date for display
  const formattedDate = format(new Date(pickedAt), 'MMM d, yyyy');
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute ${positionClasses[position]} z-10`}>
            <Badge variant="secondary" className="bg-unplayed-amber text-black">
              🎲 Picked
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Picked on {formattedDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PreviouslyPickedBadge;

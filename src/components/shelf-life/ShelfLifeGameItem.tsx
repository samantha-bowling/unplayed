
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from 'lucide-react';

interface ShelfLifeGameItemProps {
  game: any;
  index: number;
  hoveredGame: number | null;
  imageErrors: Set<number>;
  onMouseEnter: (gameId: number) => void;
  onMouseLeave: () => void;
  onJumpToGame: (gameId: number) => void;
  onMarkAsPlayed?: (gameId: number, e: React.MouseEvent) => void;
  onImageError: (gameId: number) => void;
  calculateReleaseAge: (dateString: string) => string;
  formatDate: (dateString: string) => string;
}

const ShelfLifeGameItem: React.FC<ShelfLifeGameItemProps> = ({
  game,
  index,
  hoveredGame,
  imageErrors,
  onMouseEnter,
  onMouseLeave,
  onJumpToGame,
  onMarkAsPlayed,
  onImageError,
  calculateReleaseAge,
  formatDate
}) => {
  const handleMarkAsPlayed = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsPlayed) {
      onMarkAsPlayed(game.id, e);
    }
  }, [onMarkAsPlayed, game.id]);

  const imageUrl = imageErrors.has(game.id) 
    ? '/placeholder.svg' 
    : (game.image || '/placeholder.svg');

  return (
    <div 
      className={`flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer ${
        hoveredGame === game.id 
          ? 'bg-unplayed-mint/10 border border-unplayed-mint/30' 
          : 'bg-black/30 border border-transparent'
      }`}
      onClick={() => onJumpToGame(game.id)}
      onMouseEnter={() => onMouseEnter(game.id)}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded">
        <img 
          src={imageUrl}
          alt={game.name || 'Game'} 
          className="w-full h-full object-cover" 
          loading="lazy"
          onError={() => onImageError(game.id)}
        />
      </div>
      
      <div className="ml-4 flex-grow">
        <h4 className="text-white font-medium truncate">{game.name || 'Unknown Game'}</h4>
        
        <div className="flex items-center text-xs text-gray-400">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-left truncate">
                  Released {new Date(game.releaseDate || '2000-01-01').toLocaleDateString()}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Released: {formatDate(game.releaseDate || '2000-01-01')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="text-right flex items-center gap-2">
        <span className={`text-lg font-vt ${
          index === 0 ? 'text-unplayed-red' : 
          index === 1 ? 'text-unplayed-amber' : 
          index === 2 ? 'text-unplayed-mint' : 'text-gray-300'
        }`}>
          {calculateReleaseAge(game.releaseDate || '2000-01-01')}
        </span>

        <div className={`flex-shrink-0 transition-opacity duration-200 ${
          hoveredGame === game.id ? 'opacity-100' : 'opacity-0'
        }`}>
          {onMarkAsPlayed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    title="Mark as played" 
                    onClick={handleMarkAsPlayed}
                  >
                    <Check className="h-4 w-4 text-unplayed-mint" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Mark as played</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelfLifeGameItem;

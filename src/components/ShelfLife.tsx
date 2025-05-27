
import React, { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPickerNavigation } from '@/utils/navigation';
import { getBestGameImage } from '@/utils/image-utils';

interface ShelfLifeProps {
  onJumpToGame?: (gameId: number) => void;
  onMarkAsPlayed?: (gameId: number) => void;
}

// Type for the actual shelf life data we receive
interface ShelfLifeGameData {
  id: number;
  game_id: number;
  acquisition_date: string;
  games?: {
    name: string;
    header_image?: string;
    image_url?: string;
  } | null;
}

// Memoized date calculation functions
const calculateAge = (dateString: string) => {
  const addedDate = new Date(dateString);
  const today = new Date();
  
  // Validate the date - Steam launched in 2003, so anything before that is suspicious
  if (addedDate.getFullYear() < 2003) {
    return 'Legacy game';
  }
  
  const yearDiff = today.getFullYear() - addedDate.getFullYear();
  const monthDiff = today.getMonth() - addedDate.getMonth();
  const dayDiff = today.getDate() - addedDate.getDate();
  
  let totalMonths = yearDiff * 12 + monthDiff;
  
  // Adjust for day differences
  if (dayDiff < 0) {
    totalMonths--;
  }
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years > 0) {
    if (months > 0) {
      return `${years}y ${months}m`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    return 'This month';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const ShelfLife = React.memo<ShelfLifeProps>(({
  onJumpToGame,
  onMarkAsPlayed
}: ShelfLifeProps) => {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<string>("10");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { data: dashboardData } = useDashboardData();
  const navigate = useNavigate();

  // Memoize the shelf life data and slicing
  const { allOldestGames, oldestGames } = useMemo(() => {
    const allGames = dashboardData.shelfLife || [];
    const displayCountNum = parseInt(displayCount);
    const slicedGames = allGames.slice(0, displayCountNum);
    
    return {
      allOldestGames: allGames,
      oldestGames: slicedGames
    };
  }, [dashboardData.shelfLife, displayCount]);

  // Memoized callbacks
  const handleMarkAsPlayed = useCallback((gameId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsPlayed) {
      onMarkAsPlayed(gameId);
    }
  }, [onMarkAsPlayed]);

  const handleJumpToGame = useCallback((gameId: number) => {
    if (onJumpToGame) {
      onJumpToGame(gameId);
    }
  }, [onJumpToGame]);

  const handlePickFromOldest = useCallback(() => {
    navigate('/picker', createPickerNavigation({
      source: 'shelfLife',
      shouldAutoSpin: true
    }));
  }, [navigate]);

  const handleMouseEnter = useCallback((gameId: number) => {
    setHoveredGame(gameId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredGame(null);
  }, []);

  const handleImageError = useCallback((gameId: number) => {
    setImageErrors(prev => new Set(prev).add(gameId));
  }, []);

  // Memoized game items to prevent recreation
  const gameItems = useMemo(() => 
    oldestGames.map((game: any, index) => {
      const imageUrl = imageErrors.has(game.id) 
        ? '/placeholder.svg' 
        : getBestGameImage(game.header_image, game.image, game.id);

      return (
        <div 
          key={game.id} 
          className={`flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer ${
            hoveredGame === game.id 
              ? 'bg-unplayed-mint/10 border border-unplayed-mint/30' 
              : 'bg-black/30 border border-transparent'
          }`}
          onClick={() => handleJumpToGame(game.id)}
          onMouseEnter={() => handleMouseEnter(game.id)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded">
            <img 
              src={imageUrl}
              alt={game.name || 'Game'} 
              className="w-full h-full object-cover" 
              loading="lazy"
              onError={() => handleImageError(game.id)}
            />
          </div>
          
          <div className="ml-4 flex-grow">
            <h4 className="text-white font-medium truncate">{game.name || 'Unknown Game'}</h4>
            
            <div className="flex items-center text-xs text-gray-400">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-left truncate">
                      Added on {new Date(game.addedDate).toLocaleDateString()}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Owned since: {formatDate(game.addedDate)}</p>
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
              {calculateAge(game.addedDate)}
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
                        onClick={e => handleMarkAsPlayed(game.id, e)}
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
    }), 
    [oldestGames, hoveredGame, imageErrors, handleJumpToGame, handleMouseEnter, handleMouseLeave, handleMarkAsPlayed, onMarkAsPlayed, handleImageError]
  );

  return (
    <div className="terminal-container w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="terminal-header text-2xl">Shelf Life</h3>
        <div className="flex items-center gap-3">
          <Select value={displayCount} onValueChange={setDisplayCount}>
            <SelectTrigger className="w-32 h-8 text-xs bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Top 10" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="10" className="text-white hover:bg-gray-700">Top 10</SelectItem>
              <SelectItem value="25" className="text-white hover:bg-gray-700">Top 25</SelectItem>
              <SelectItem value="50" className="text-white hover:bg-gray-700">Top 50</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs border-unplayed-mint/30 text-unplayed-mint hover:bg-unplayed-mint/10"
            onClick={handlePickFromOldest}
            disabled={oldestGames.length === 0}
          >
            Pick from oldest
          </Button>
        </div>
      </div>
      
      <div className="flex items-center mb-4">
        <p className="text-sm text-gray-400">
          Oldest Games Still Sealed in Digital Shrink Wrap
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-gray-500 hover:text-gray-400">
                <Info size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">These games have been in your library the longest without being played.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {gameItems}
        </div>
      </ScrollArea>
      
      {oldestGames.length === 0 && (
        <div className="text-center p-6">
          <p className="text-gray-400">No unplayed games found in your library.</p>
        </div>
      )}
      
      {oldestGames.length > 0 && allOldestGames.length <= 5 && (
        <div className="text-center p-4 mt-4 border-t border-gray-800">
          <p className="text-unplayed-mint text-sm">Nice work! You're tackling your oldest games.</p>
        </div>
      )}
      
      {allOldestGames.length > parseInt(displayCount) && (
        <div className="text-center p-2 mt-2 border-t border-gray-800">
          <p className="text-gray-500 text-xs">
            Showing {oldestGames.length} of {allOldestGames.length} unplayed games
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.onJumpToGame === nextProps.onJumpToGame &&
    prevProps.onMarkAsPlayed === nextProps.onMarkAsPlayed
  );
});

ShelfLife.displayName = 'ShelfLife';

export default ShelfLife;

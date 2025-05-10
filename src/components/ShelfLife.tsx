
import { useState } from 'react';
import useUnplayedData from '@/hooks/use-unplayed-data';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ArrowDown, Clock, Info } from 'lucide-react';

interface ShelfLifeProps {
  onJumpToGame?: (gameId: number) => void;
  onMarkAsPlayed?: (gameId: number) => void;
}

const calculateAge = (dateString: string) => {
  const addedDate = new Date(dateString);
  const today = new Date();
  
  const yearDiff = today.getFullYear() - addedDate.getFullYear();
  const monthDiff = today.getMonth() - addedDate.getMonth();
  
  let age = yearDiff;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < addedDate.getDate())) {
    age--;
  }
  
  // Return years and months for more precision
  const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
  
  if (age > 0) {
    return `${age} ${age === 1 ? 'year' : 'years'}`;
  } else {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
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

const ShelfLife = ({ onJumpToGame, onMarkAsPlayed }: ShelfLifeProps) => {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const { data: unplayedData } = useUnplayedData();
  
  // Use shelf life data from unplayedData
  const oldestGames = unplayedData.shelfLife;

  const handleMarkAsPlayed = (gameId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsPlayed) {
      onMarkAsPlayed(gameId);
    }
  };

  const handleJumpToGame = (gameId: number) => {
    if (onJumpToGame) {
      onJumpToGame(gameId);
    }
  };

  return (
    <div className="terminal-container w-full h-full">
      <div className="terminal-header flex justify-between items-center mb-2">
        <h3 className="text-2xl">Shelf Life</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-unplayed-mint/60 hover:text-unplayed-mint transition-colors">
                <Info size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">These are your oldest unplayed games. Click on a game to find it in your library or mark it as played.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-sm text-gray-400 mb-6">Oldest Games Still Sealed in Digital Shrink Wrap</p>
      
      <div className="space-y-3">
        {oldestGames.map((game, index) => (
          <div 
            key={game.id}
            className={`flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer ${
              hoveredGame === game.id 
                ? 'bg-unplayed-mint/10 border border-unplayed-mint/30' 
                : 'bg-black/30 border border-transparent'
            }`}
            onClick={() => handleJumpToGame(game.id)}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
          >
            <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded">
              <img 
                src={game.imageUrl} 
                alt={game.title} 
                className="w-full h-full object-cover"
                loading="lazy" // Add lazy loading for better performance
              />
            </div>
            
            <div className="ml-4 flex-grow">
              <h4 className="text-white font-medium truncate">{game.title}</h4>
              
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
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
                'text-unplayed-mint'
              }`}>
                {calculateAge(game.addedDate)}
              </span>

              <div className={`flex-shrink-0 sm:transition-opacity sm:duration-200 ${hoveredGame === game.id || true ? 'sm:opacity-100' : 'sm:opacity-0'}`}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        title="Jump to game in library"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToGame(game.id);
                        }}
                      >
                        <ArrowDown className="h-4 w-4 text-unplayed-mint" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Jump to game in library</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {onMarkAsPlayed && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          title="Mark as played"
                          onClick={(e) => handleMarkAsPlayed(game.id, e)}
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
        ))}
      </div>
      
      {oldestGames.length === 0 && (
        <div className="text-center p-6">
          <p className="text-gray-400">No unplayed games found in your library.</p>
        </div>
      )}
      
      {oldestGames.length > 0 && oldestGames.length < 5 && (
        <div className="text-center p-4 mt-4 border-t border-gray-800">
          <p className="text-unplayed-mint text-sm">Nice work! You're tackling your oldest games.</p>
        </div>
      )}
    </div>
  );
};

export default ShelfLife;

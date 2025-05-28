
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, ExternalLink, Calendar, Clock, DollarSign } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatDate, formatPlaytime, formatPrice } from '@/utils/format-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import GameReviewCard from '@/components/GameReviewCard';
import useSteamReviews from '@/hooks/use-steam-reviews';
import { toast } from '@/hooks/use-toast';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
  disabled?: boolean;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ 
  game, 
  onPlayGame, 
  onRollAgain,
  disabled = false
}) => {
  const gameImage = getBestGameImage(game.header_image, game.image, game.id);
  
  const {
    review,
    isLoading: isLoadingReview,
    hasFetched,
    fetchReviews,
    cycleNextReview,
    tryAnotherFallback,
    hasReviews
  } = useSteamReviews(game.id);
  
  const handleViewOnSteam = () => {
    const steamStoreUrl = `https://store.steampowered.com/app/${game.id}`;
    window.open(steamStoreUrl, '_blank');
  };

  const handlePlayGame = () => {
    onPlayGame();
    
    toast({
      title: "Launching game",
      description: `Opening ${game.name} in Steam`,
    });
  };

  // Helper functions for backward compatibility
  const getGameReleaseDate = () => game.release_date || game.releaseDate;
  const getGamePriceCents = () => game.price_cents || (game.price ? game.price * 100 : undefined);

  // Check if description is long enough to warrant scrolling
  const isDescriptionLong = game.description && game.description.length > 300;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg">
      <div className="p-6 pb-4">
        <h2 className="text-xl text-gray-200 mb-6 font-semibold">
          Your Random Pick
        </h2>
        
        {/* Game Info - Enhanced Layout */}
        <div className="flex items-start space-x-4 mb-6">
          <img 
            src={gameImage} 
            alt={game.name}
            className="w-24 h-24 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{game.name}</h3>
            {game.developer && game.developer.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                by {game.developer.join(', ')}
              </p>
            )}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {game.genres.slice(0, 3).map(genre => (
                  <span key={genre} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Game Metadata - Enhanced Display */}
        <div className="grid grid-cols-1 gap-3 text-sm bg-gray-800/30 rounded-lg p-4 mb-6">
          {getGameReleaseDate() && (
            <div className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-500 mr-2 min-w-[80px]">Released:</span>
              <span className="font-medium">{formatDate(getGameReleaseDate())}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-300">
            <Clock className="w-4 h-4 mr-3 text-gray-500" />
            <span className="text-gray-500 mr-2 min-w-[80px]">Playtime:</span>
            <span className="font-medium">{formatPlaytime(game.playtimeMinutes)}</span>
          </div>

          {getGamePriceCents() && (
            <div className="flex items-center text-gray-300">
              <DollarSign className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-500 mr-2 min-w-[80px]">Price:</span>
              <span className="font-medium">{formatPrice(getGamePriceCents())}</span>
            </div>
          )}
        </div>

        {/* Game Description - Conditional ScrollArea */}
        {game.description && (
          <div className="bg-gray-800/20 rounded-lg p-4 mb-6">
            <h4 className="text-gray-300 mb-3 font-semibold text-sm uppercase tracking-wide">About This Game</h4>
            {isDescriptionLong ? (
              <ScrollArea className="max-h-32">
                <div className="text-gray-300 leading-relaxed text-sm pr-4">
                  {game.description.replace(/<[^>]*>/g, '')}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-gray-300 leading-relaxed text-sm">
                {game.description.replace(/<[^>]*>/g, '')}
              </div>
            )}
          </div>
        )}

        {/* Steam Review Section */}
        <div className="bg-gray-800/20 rounded-lg p-4 mb-6">
          <GameReviewCard
            review={review}
            isLoading={isLoadingReview}
            hasFetched={hasFetched}
            onGetReview={fetchReviews}
            onGetAnotherReview={hasReviews ? cycleNextReview : tryAnotherFallback}
            gameId={game.id}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handlePlayGame}
            className="flex-1 bg-green-600 hover:bg-green-700 font-semibold"
            size="lg"
            disabled={disabled}
          >
            <Play className="w-4 h-4 mr-2" />
            Play Now
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onRollAgain}
            className="border-gray-600 hover:bg-gray-800"
            size="lg"
            disabled={disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Roll Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleViewOnSteam}
            className="border-gray-600 hover:bg-gray-800 px-4"
            size="lg"
            disabled={disabled}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedGame;

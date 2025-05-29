
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Calendar, Clock, DollarSign, RotateCcw } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatDate, formatPlaytime, formatPrice } from '@/utils/format-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import GameReviewCard from '@/components/GameReviewCard';
import useSteamReviews from '@/hooks/use-steam-reviews';
import { toast } from '@/hooks/use-toast';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
  disabled?: boolean;
  headerMessage?: string;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ 
  game, 
  onPlayGame, 
  onRollAgain,
  disabled = false,
  headerMessage = "Your Random Pick"
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

  // Check if description exists and is meaningful
  const hasDescription = game.description && game.description.trim().length > 0;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl text-gray-200 mb-6 font-semibold">
        {headerMessage}
      </h2>
      
      {/* Main Game Layout - Image takes 1/3, content takes 2/3 */}
      <div className="flex gap-6 mb-6">
        {/* Left: Game Image (1/3 of horizontal space) */}
        <div className="w-1/3 flex-shrink-0">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={gameImage} 
              alt={game.name}
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
          </AspectRatio>
        </div>
        
        {/* Right: Game Info and Actions (2/3 of horizontal space) */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Top section: Game name, developer, genres, and Play button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-2xl font-semibold text-white mb-2 leading-tight">{game.name}</h3>
              {game.developer && game.developer.length > 0 && (
                <p className="text-sm text-gray-400 mb-3">
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
            
            {/* Prominent Play Button */}
            <div className="flex-shrink-0">
              <Button 
                onClick={handlePlayGame}
                className="bg-green-600 hover:bg-green-700 font-semibold text-lg px-8 py-3"
                size="lg"
                disabled={disabled}
              >
                <Play className="w-5 h-5 mr-2" />
                Play Now
              </Button>
            </div>
          </div>

          {/* Game metadata and Steam link */}
          <div className="flex items-center justify-between text-sm bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-4">
              {getGameReleaseDate() && (
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-3 h-3 mr-2 text-gray-500" />
                  <span className="text-gray-500 mr-1 text-xs">Released:</span>
                  <span className="font-medium text-xs">{formatDate(getGameReleaseDate())}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-300">
                <Clock className="w-3 h-3 mr-2 text-gray-500" />
                <span className="text-gray-500 mr-1 text-xs">Playtime:</span>
                <span className="font-medium text-xs">{formatPlaytime(game.playtimeMinutes)}</span>
              </div>

              {getGamePriceCents() && (
                <div className="flex items-center text-gray-300">
                  <DollarSign className="w-3 h-3 mr-2 text-gray-500" />
                  <span className="text-gray-500 mr-1 text-xs">Price:</span>
                  <span className="font-medium text-xs">{formatPrice(getGamePriceCents())}</span>
                </div>
              )}
            </div>
            
            {/* Steam Link */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewOnSteam}
              className="text-gray-400 hover:text-unplayed-amber hover:bg-gray-800 px-3 py-1 h-auto"
              disabled={disabled}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              <span className="text-xs">View on Steam</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Game Description */}
      {hasDescription && (
        <div className="bg-gray-800/20 rounded-lg p-4 mb-6">
          <h4 className="text-gray-300 mb-3 font-semibold text-sm uppercase tracking-wide">About This Game</h4>
          <ScrollArea className="max-h-40">
            <div className="text-gray-300 leading-relaxed text-sm pr-4">
              {game.description.replace(/<[^>]*>/g, '')}
            </div>
          </ScrollArea>
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

      {/* Action Buttons at the bottom */}
      <div className="flex gap-3">
        <Button 
          onClick={onRollAgain}
          variant="outline"
          className="flex-1 border-gray-600 hover:bg-gray-800"
          disabled={disabled}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Roll Again
        </Button>
        
        <button className="btn-amber-outline flex-1">
          Give me a reason to play
        </button>
      </div>
    </div>
  );
};

export default SelectedGame;

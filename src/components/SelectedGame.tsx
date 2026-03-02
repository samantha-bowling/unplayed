
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Calendar, Clock, DollarSign } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatDate, formatPlaytime, formatPrice } from '@/utils/format-utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import GameReviewCard from '@/components/GameReviewCard';
import useSteamReviews from '@/hooks/use-steam-reviews';
import { toast } from 'sonner';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
  disabled?: boolean;
  headerMessage?: string;
  isDemo?: boolean;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ 
  game, 
  onPlayGame, 
  onRollAgain,
  disabled = false,
  headerMessage = "Your Random Pick",
  isDemo = false
}) => {
  const gameImage = getBestGameImage(game.header_image, game.image_url, game.id);
  
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
    
    toast("Launching game", {
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
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Left: Game Image */}
        <div className="w-full md:w-1/3 flex-shrink-0">
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
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
            
            {/* Prominent Play Button - Standardized styling */}
            <div className="flex-shrink-0">
              <Button 
                onClick={handlePlayGame}
                className="bg-green-600 hover:bg-green-700 font-semibold px-6 py-2 w-full sm:w-auto"
                size="lg"
                disabled={disabled}
              >
                <Play className="w-4 h-4 mr-2" />
                Play Now
              </Button>
            </div>
          </div>

          {/* Game metadata - stacked vertically */}
          <div className="space-y-2 mb-4">
            {getGameReleaseDate() && (
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-500 mr-2 text-sm">Released:</span>
                <span className="font-medium text-sm">{formatDate(getGameReleaseDate())}</span>
              </div>
            )}
            
            <div className="flex items-center text-gray-300">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-500 mr-2 text-sm">Playtime:</span>
              <span className="font-medium text-sm">{formatPlaytime(game.playtimeMinutes)}</span>
            </div>

            {getGamePriceCents() && (
              <div className="flex items-center text-gray-300">
                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-500 mr-2 text-sm">Price:</span>
                <span className="font-medium text-sm">{formatPrice(getGamePriceCents())}</span>
              </div>
            )}
            
            {/* Steam Link */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewOnSteam}
              className="text-gray-400 hover:text-unplayed-amber px-0 py-1 h-auto justify-start"
              disabled={disabled}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              <span className="text-sm">View on Steam</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Review Display - Always show GameReviewCard */}
      <GameReviewCard
        review={review}
        isLoading={isLoadingReview}
        hasFetched={hasFetched}
        onGetReview={fetchReviews}
        onGetAnotherReview={cycleNextReview}
        gameId={game.id}
        isDemo={isDemo}
      />
    </div>
  );
};

export default SelectedGame;

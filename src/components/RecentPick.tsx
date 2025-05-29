
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Calendar, Clock, DollarSign } from 'lucide-react';
import { GamePick } from '@/types/picks.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatDate, formatPlaytime, formatPrice } from '@/utils/format-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import GameReviewCard from '@/components/GameReviewCard';
import useSteamReviews from '@/hooks/use-steam-reviews';
import { toast } from '@/hooks/use-toast';

interface RecentPickProps {
  recentPick: GamePick | null;
}

const RecentPick: React.FC<RecentPickProps> = ({ recentPick }) => {
  const {
    review,
    isLoading: isLoadingReview,
    hasFetched,
    fetchReviews,
    cycleNextReview,
    tryAnotherFallback,
    hasReviews
  } = useSteamReviews(recentPick?.game_id || null);

  if (!recentPick) return null;

  // Handle both nested and direct game data from database
  const gameData = recentPick.game && Object.keys(recentPick.game).length > 0 ? recentPick.game : null;
  const userGameData = recentPick.userGameData;
  const gameName = gameData?.name || `Game #${recentPick.game_id}`;
  const gameImage = getBestGameImage(
    gameData?.header_image || null,
    gameData?.image_url || null,
    recentPick.game_id
  );

  const handlePlayGame = () => {
    const steamUrl = `steam://run/${recentPick.game_id}`;
    window.open(steamUrl, '_blank');
    
    toast({
      title: "Launching game",
      description: `Opening ${gameName} in Steam`,
    });
  };

  const handleViewOnSteam = () => {
    const steamStoreUrl = `https://store.steampowered.com/app/${recentPick.game_id}`;
    window.open(steamStoreUrl, '_blank');
  };

  // Check if description exists and is meaningful
  const hasDescription = gameData?.description && gameData.description.trim().length > 0;

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-200 flex items-center justify-between">
          Recently Picked
          <span className="text-sm text-gray-500 font-normal">
            {formatDate(recentPick.picked_at)}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Game Layout - Image takes 1/3, content takes 2/3 */}
        <div className="flex gap-6">
          {/* Left: Game Image (1/3 of horizontal space) */}
          <div className="w-1/3 flex-shrink-0">
            <AspectRatio ratio={16 / 9}>
              <img 
                src={gameImage} 
                alt={gameName}
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </AspectRatio>
          </div>
          
          {/* Right: Game Info and Actions (2/3 of horizontal space) */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Top section: Game name and Play button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-xl font-semibold text-white mb-2 leading-tight">{gameName}</h3>
              </div>
              
              {/* Prominent Play Button */}
              <div className="flex-shrink-0">
                <Button 
                  onClick={handlePlayGame}
                  className="bg-green-600 hover:bg-green-700 font-semibold px-6 py-2"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
              </div>
            </div>

            {/* Game info stacked vertically */}
            <div className="space-y-3">
              {/* Developer */}
              {gameData?.developer && gameData.developer.length > 0 && (
                <p className="text-sm text-gray-400">
                  by {gameData.developer.join(', ')}
                </p>
              )}
              
              {/* Genres and Mood */}
              <div className="flex flex-wrap gap-1">
                {gameData?.genres && gameData.genres.length > 0 && (
                  gameData.genres.slice(0, 3).map(genre => (
                    <span key={genre} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                      {genre}
                    </span>
                  ))
                )}
                {recentPick.filters?.mood && (
                  <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded">
                    Mood: {recentPick.filters.mood}
                  </span>
                )}
              </div>

              {/* Game metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                {gameData?.release_date && (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-2 text-gray-500" />
                    <span className="text-gray-500 mr-1 text-xs">Released:</span>
                    <span className="font-medium text-xs">{formatDate(gameData.release_date)}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2 text-gray-500" />
                  <span className="text-gray-500 mr-1 text-xs">Playtime:</span>
                  <span className="font-medium text-xs">{formatPlaytime(userGameData?.playtime_minutes)}</span>
                </div>

                {gameData?.price_cents && (
                  <div className="flex items-center">
                    <DollarSign className="w-3 h-3 mr-2 text-gray-500" />
                    <span className="text-gray-500 mr-1 text-xs">Price:</span>
                    <span className="font-medium text-xs">{formatPrice(gameData.price_cents)}</span>
                  </div>
                )}
              </div>
              
              {/* Steam Link */}
              <div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleViewOnSteam}
                  className="text-gray-400 hover:text-unplayed-amber hover:bg-gray-800 px-3 py-1 h-auto"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  <span className="text-xs">View on Steam</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Description */}
        {hasDescription && (
          <div className="bg-gray-800/20 rounded-lg p-4">
            <h4 className="text-gray-300 mb-3 font-semibold text-sm uppercase tracking-wide">About This Game</h4>
            <ScrollArea className="max-h-40">
              <div className="text-gray-300 leading-relaxed text-sm pr-4">
                {gameData.description.replace(/<[^>]*>/g, '')}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Steam Review Section */}
        <div className="bg-gray-800/20 rounded-lg p-4">
          <GameReviewCard
            review={review}
            isLoading={isLoadingReview}
            hasFetched={hasFetched}
            onGetReview={fetchReviews}
            onGetAnotherReview={hasReviews ? cycleNextReview : tryAnotherFallback}
            gameId={recentPick.game_id}
          />
        </div>

        {/* Give me a reason to play button */}
        <div className="pt-2">
          <button className="btn-amber-outline w-full">
            Give me a reason to play
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPick;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Calendar, Clock, DollarSign } from 'lucide-react';
import { GamePick } from '@/types/picks.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatDate, formatPlaytime, formatPrice } from '@/utils/format-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        {/* Game Info - Enhanced Layout */}
        <div className="flex items-start space-x-4">
          <img 
            src={gameImage} 
            alt={gameName}
            className="w-24 h-24 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{gameName}</h3>
            {gameData?.developer && gameData.developer.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                by {gameData.developer.join(', ')}
              </p>
            )}
            {gameData?.genres && gameData.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {gameData.genres.slice(0, 3).map(genre => (
                  <span key={genre} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            {recentPick.filters?.mood && (
              <span className="inline-block px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded">
                Mood: {recentPick.filters.mood}
              </span>
            )}
          </div>
        </div>

        {/* Game Metadata - Enhanced Display */}
        <div className="grid grid-cols-1 gap-3 text-sm bg-gray-800/30 rounded-lg p-4">
          {gameData?.release_date && (
            <div className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-500 mr-2 min-w-[80px]">Released:</span>
              <span className="font-medium">{formatDate(gameData.release_date)}</span>
            </div>
          )}
          
          {userGameData?.acquisition_date && (
            <div className="flex items-center text-gray-300">
              <DollarSign className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-500 mr-2 min-w-[80px]">Purchased:</span>
              <span className="font-medium">{formatDate(userGameData.acquisition_date)}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-300">
            <Clock className="w-4 h-4 mr-3 text-gray-500" />
            <span className="text-gray-500 mr-2 min-w-[80px]">Playtime:</span>
            <span className="font-medium">{formatPlaytime(userGameData?.playtime_minutes)}</span>
          </div>

          {gameData?.price_cents && (
            <div className="flex items-center text-gray-300">
              <DollarSign className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-500 mr-2 min-w-[80px]">Price:</span>
              <span className="font-medium">{formatPrice(gameData.price_cents)}</span>
            </div>
          )}
        </div>

        {/* Game Description - Scrollable */}
        {gameData?.description && (
          <div className="bg-gray-800/20 rounded-lg p-4">
            <h4 className="text-gray-300 mb-3 font-semibold text-sm uppercase tracking-wide">About This Game</h4>
            <ScrollArea className="max-h-32">
              <div className="text-gray-300 leading-relaxed text-sm pr-4">
                {gameData.description.replace(/<[^>]*>/g, '')}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Steam Review Section - Enhanced */}
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

        {/* Action Buttons - Enhanced Layout */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handlePlayGame}
            className="flex-1 bg-green-600 hover:bg-green-700 font-semibold"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            Play Now
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleViewOnSteam}
            className="border-gray-600 hover:bg-gray-800 px-4"
            size="lg"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPick;

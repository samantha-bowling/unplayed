
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecentPickProps {
  recentPick: GamePick | null;
  isDemo?: boolean;
}

const RecentPick: React.FC<RecentPickProps> = ({ recentPick, isDemo = false }) => {
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

  const handleGetReview = () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Sign in to fetch real Steam reviews that will motivate you to play!",
      });
      return;
    }
    fetchReviews();
  };

  const reasonButton = (
    <button 
      className="btn-amber-outline w-full"
      onClick={handleGetReview}
      disabled={isLoadingReview}
    >
      {isLoadingReview ? 'Finding reasons...' : hasReviews ? 'Show another reason' : 'Give me a reason to play'}
    </button>
  );

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
            {/* Top section: Game name, developer, genres, and Play button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-xl font-semibold text-white mb-2 leading-tight">{gameName}</h3>
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

            {/* Game metadata - stacked vertically */}
            <div className="space-y-2">
              {gameData?.release_date && (
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-500 mr-2 text-sm">Released:</span>
                  <span className="font-medium text-sm">{formatDate(gameData.release_date)}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-300">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-500 mr-2 text-sm">Playtime:</span>
                <span className="font-medium text-sm">{formatPlaytime(userGameData?.playtime_minutes)}</span>
              </div>

              {gameData?.price_cents && (
                <div className="flex items-center text-gray-300">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-500 mr-2 text-sm">Price:</span>
                  <span className="font-medium text-sm">{formatPrice(gameData.price_cents)}</span>
                </div>
              )}
              
              {/* Steam Link */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewOnSteam}
                className="text-gray-400 hover:text-unplayed-amber hover:bg-gray-800 px-0 py-1 h-auto justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="text-sm">View on Steam</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Give me a reason to play button */}
        <div className="pt-2">
          {isDemo ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {reasonButton}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch a positive Steam review to give you motivation to play this game!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            reasonButton
          )}
        </div>

        {/* Review Display */}
        {!isDemo && (
          <GameReviewCard
            review={review}
            isLoading={isLoadingReview}
            hasFetched={hasFetched}
            onGetReview={handleGetReview}
            onGetAnotherReview={cycleNextReview}
            gameId={recentPick.game_id}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPick;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play } from 'lucide-react';
import { GamePick } from '@/types/picks.types';
import { getBestGameImage } from '@/utils/image-utils';
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
    cycleNextReview,
    tryAnotherFallback,
    hasReviews
  } = useSteamReviews(recentPick?.game_id || null);

  if (!recentPick) return null;

  // Handle both nested and direct game data from database
  const gameData = recentPick.game && Object.keys(recentPick.game).length > 0 ? recentPick.game : null;
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-300 flex items-center justify-between">
          Recently Picked
          <span className="text-xs text-gray-500 font-normal">
            {new Date(recentPick.picked_at).toLocaleDateString()}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Game Info */}
        <div className="flex items-start space-x-3">
          <img 
            src={gameImage} 
            alt={gameName}
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{gameName}</h3>
            {gameData?.developer && gameData.developer.length > 0 && (
              <p className="text-sm text-gray-400 truncate">
                by {gameData.developer.join(', ')}
              </p>
            )}
            {recentPick.filters?.mood && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                {recentPick.filters.mood}
              </span>
            )}
          </div>
        </div>

        {/* Game Description */}
        {gameData?.description && (
          <div className="text-sm text-gray-300">
            <p className="line-clamp-3">
              {gameData.description.replace(/<[^>]*>/g, '').slice(0, 200)}
              {gameData.description.length > 200 ? '...' : ''}
            </p>
          </div>
        )}

        {/* Steam Review Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">Give me a reason to play</h4>
          </div>
          
          <GameReviewCard
            review={review}
            isLoading={isLoadingReview}
            onGetAnotherReview={hasReviews ? cycleNextReview : tryAnotherFallback}
            gameId={recentPick.game_id}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handlePlayGame}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Play Now
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleViewOnSteam}
            className="border-gray-600 hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPick;

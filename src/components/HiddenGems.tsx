
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Play, Star } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImage, formatGameTitle } from '@/utils/image-utils';

const HiddenGems = () => {
  const { games } = useLibraryData();

  // Find hidden gems: unplayed/low playtime games with high Metacritic scores
  const hiddenGems = React.useMemo(() => {
    return games
      .filter(game => {
        // Filter for unplayed or very low playtime games (≤ 30 minutes)
        const playtime = game.userGame?.playtime_minutes || 0;
        const hasHighScore = game.metacritic_score && game.metacritic_score >= 70;
        return playtime <= 30 && hasHighScore;
      })
      .sort((a, b) => (b.metacritic_score || 0) - (a.metacritic_score || 0))
      .slice(0, 3)
      .map(game => ({
        id: game.id,
        name: game.name,
        metacriticScore: game.metacritic_score,
        image: getBestGameImage(game.header_image, game.image_url, game.id),
        playtime: game.userGame?.playtime_minutes || 0
      }));
  }, [games]);

  // Launch game directly using steam:// protocol
  const handlePlayNow = (gameId: number) => {
    const steamUrl = `steam://rungameid/${gameId}`;
    window.open(steamUrl, '_blank');
  };

  return (
    <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gem className="h-5 w-5 text-purple-400" />
          <span>Hidden Gems</span>
        </CardTitle>
        <p className="text-sm text-gray-400">
          High-rated games waiting to be discovered
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {hiddenGems.length > 0 ? (
          hiddenGems.map((game, index) => (
            <div key={game.id} className="flex items-center space-x-3 p-3 rounded-lg bg-black/30 border border-gray-700 hover:border-purple-500/50 transition-colors group">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Gem className="w-4 h-4 text-white" />
              </div>
              
              {game.image && (
                <div className="w-16 h-9 flex-shrink-0">
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-full h-full object-cover rounded aspect-video"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate" title={game.name}>
                  {formatGameTitle(game.name)}
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-yellow-400 font-medium">{game.metacriticScore}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">
                    {game.playtime === 0 ? 'Unplayed' : `${game.playtime}m played`}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => handlePlayNow(game.id)}
                size="sm"
                className="bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
                variant="outline"
              >
                <Play className="w-3 h-3 mr-1" />
                Play
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Gem className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hidden gems found</p>
            <p className="text-xs mt-1">
              Try playing some of your unplayed games with high ratings!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HiddenGems;

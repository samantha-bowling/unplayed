
import React from 'react';
import { GamePick } from '@/types/picks.types';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/format-utils';
import { getBestGameImage } from '@/utils/image-utils';

interface RecentPickProps {
  recentPick: GamePick;
  isDemo?: boolean;
}

const RecentPick: React.FC<RecentPickProps> = ({ recentPick, isDemo = false }) => {
  const gameImage = getBestGameImage(
    recentPick.game?.header_image,
    recentPick.game?.image_url,
    recentPick.game_id
  );

  const handlePlayGame = () => {
    const steamUrl = `steam://rungameid/${recentPick.game_id}`;
    window.location.href = steamUrl;
  };

  const handleViewOnSteam = () => {
    const steamStoreUrl = `https://store.steampowered.com/app/${recentPick.game_id}`;
    window.open(steamStoreUrl, '_blank');
  };

  return (
    <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-gray-200 mb-3">Recently Picked</h4>
      
      <div className="flex gap-4">
        {/* Game Image */}
        <div className="w-20 h-12 flex-shrink-0">
          <img 
            src={gameImage}
            alt={recentPick.game?.name || 'Game'}
            className="w-full h-full object-cover rounded"
          />
        </div>
        
        {/* Game Info */}
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-white truncate">
            {recentPick.game?.name || `Game ${recentPick.game_id}`}
          </h5>
          <p className="text-sm text-gray-400">
            Picked {formatDate(recentPick.picked_at)}
          </p>
          {recentPick.filters?.mood && (
            <p className="text-xs text-blue-400">
              Mood: {recentPick.filters.mood}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {!isDemo && (
            <Button 
              size="sm" 
              onClick={handlePlayGame}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleViewOnSteam}
            className="text-gray-400 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecentPick;

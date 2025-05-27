
import React, { useState } from 'react';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick } from '@/types/picks.types';
import GamePickCard from './GamePickCard';
import { getBestGameImage } from '@/utils/image-utils';

interface RecentlySelectedProps {
  recentPicks: GamePick[] | undefined;
  spinHistory: GameListItem[];
}

const RecentlySelected: React.FC<RecentlySelectedProps> = ({ recentPicks, spinHistory }) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (gameId: number) => {
    setImageErrors(prev => new Set(prev).add(gameId));
  };

  if (!recentPicks?.length && !spinHistory.length) return null;
  
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-300 mb-3">Recently Selected</h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {recentPicks && recentPicks.length > 0 ? (
          recentPicks.slice(0, 5).map((pick) => {
            // Handle both nested and direct game data from database
            // Check if pick.game has actual data or is an empty object
            const gameData = pick.game && Object.keys(pick.game).length > 0 ? pick.game : null;
            const gameItem: GameListItem = {
              id: pick.game_id,
              name: gameData?.name || `Game #${pick.game_id}`,
              playtimeMinutes: 0,
              // Map database properties to GameListItem properties
              image: gameData?.image_url || null,
              header_image: gameData?.header_image || null
            };
            
            return (
              <GamePickCard 
                key={pick.id} 
                game={gameItem}
                pick={pick}
                compact={true}
              />
            );
          })
        ) : spinHistory.map((game, index) => {
          const hasImageError = imageErrors.has(game.id);
          const gameImage = hasImageError ? '/placeholder.svg' : getBestGameImage(
            game.header_image || null, 
            game.image || null, 
            game.id
          );

          return (
            <div key={`history-${index}`} className="bg-black/30 rounded p-2 text-sm flex items-center">
              <img 
                src={gameImage} 
                alt={game.name} 
                className="w-8 h-8 object-cover rounded mr-2" 
                onError={() => handleImageError(game.id)}
              />
              <span className="text-gray-300 truncate">{game.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlySelected;

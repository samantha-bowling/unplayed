
import React from 'react';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick } from '@/types/picks.types';
import GamePickCard from './GamePickCard';

interface RecentlySelectedProps {
  recentPicks: GamePick[] | undefined;
  spinHistory: GameListItem[];
}

const RecentlySelected: React.FC<RecentlySelectedProps> = ({ recentPicks, spinHistory }) => {
  if (!recentPicks?.length && !spinHistory.length) return null;
  
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-300 mb-3">Recently Selected</h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {recentPicks && recentPicks.length > 0 ? (
          recentPicks.slice(0, 5).map((pick) => (
            <GamePickCard 
              key={pick.id} 
              game={pick.game || { id: pick.game_id, name: `Game #${pick.game_id}`, playtimeMinutes: 0, image: null } as GameListItem} 
              pick={pick}
              compact={true}
            />
          ))
        ) : spinHistory.map((game, index) => (
          <div key={`history-${index}`} className="bg-black/30 rounded p-2 text-sm flex items-center">
            <img src={game.image || ''} alt={game.name} className="w-8 h-8 object-cover rounded mr-2" />
            <span className="text-gray-300 truncate">{game.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlySelected;

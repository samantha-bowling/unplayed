
import React from 'react';
import GamePickCard from '@/components/GamePickCard';
import PreviouslyPickedBadge from '@/components/PreviouslyPickedBadge';
import usePreviouslyPicked from '@/hooks/use-previously-picked';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick } from '@/types/picks.types';

interface PickerGameCardProps {
  game: GameListItem;
  recentPicks?: GamePick[];
  onClick?: () => void;
}

/**
 * Enhanced GameCard that shows a Previously Picked badge if applicable
 */
const PickerGameCard: React.FC<PickerGameCardProps> = ({ 
  game, 
  recentPicks,
  onClick 
}) => {
  const { isPreviouslyPicked, lastPickedAt } = usePreviouslyPicked(recentPicks, game.id);
  
  return (
    <div className="relative">
      <GamePickCard 
        game={{
          ...game,
          title: game.name, // Map name to title for backward compatibility
          imageUrl: game.image // Map image to imageUrl for backward compatibility
        }}
        compact={false}
        onClick={onClick}
      />
      {isPreviouslyPicked && lastPickedAt && (
        <PreviouslyPickedBadge pickedAt={lastPickedAt} />
      )}
    </div>
  );
};

export default PickerGameCard;

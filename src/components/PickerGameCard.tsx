
import React from 'react';
import GameCard from '@/components/GameCard';
import PreviouslyPickedBadge from '@/components/PreviouslyPickedBadge';
import usePreviouslyPicked from '@/hooks/use-previously-picked';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick } from '@/hooks/use-game-picks';

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
      <GameCard 
        id={game.id.toString()}
        gameId={game.id}
        title={game.title}
        imageUrl={game.imageUrl}
        dustScore={game.dustScore}
        playtimeMinutes={game.playtimeMinutes}
        isHidden={game.isHidden}
        notes={game.notes}
        onMarkAsPlayed={() => {}}
        onToggleHidden={() => {}}
        onSaveNote={() => {}}
        onClick={onClick}
      />
      {isPreviouslyPicked && lastPickedAt && (
        <PreviouslyPickedBadge pickedAt={lastPickedAt} />
      )}
    </div>
  );
};

export default PickerGameCard;


import React from 'react';

interface ShelfLifeFooterProps {
  oldestGames: any[];
  allOldestGames: any[];
  displayCount: string;
}

const ShelfLifeFooter: React.FC<ShelfLifeFooterProps> = ({
  oldestGames,
  allOldestGames,
  displayCount
}) => {
  if (oldestGames.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-400">No unplayed games found in your library.</p>
      </div>
    );
  }

  return (
    <>
      {oldestGames.length > 0 && allOldestGames.length <= 5 && (
        <div className="text-center p-4 mt-4 border-t border-gray-800">
          <p className="text-unplayed-mint text-sm">Nice work! You're tackling your oldest unplayed games.</p>
        </div>
      )}
      
      {allOldestGames.length > parseInt(displayCount) && (
        <div className="text-center p-2 mt-2 border-t border-gray-800">
          <p className="text-gray-500 text-xs">
            Showing {oldestGames.length} of {allOldestGames.length} unplayed games
          </p>
        </div>
      )}
    </>
  );
};

export default ShelfLifeFooter;

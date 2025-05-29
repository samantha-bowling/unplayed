
import React from 'react';
import LibraryStatsSection from '@/components/LibraryStatsSection';
import GenreHoarding from '@/components/GenreHoarding';
import ShelfLife from '@/components/ShelfLife';

interface LibraryTopSectionProps {
  totalGames: number;
  unplayedGames: number;
  activeGenre?: string | null;
  onGenreSelect: (genre: string) => void;
  onJumpToGame: (gameId: number) => void;
  onMarkAsPlayed: (gameId: number) => void;
}

const LibraryTopSection: React.FC<LibraryTopSectionProps> = ({
  totalGames,
  unplayedGames,
  activeGenre,
  onGenreSelect,
  onJumpToGame,
  onMarkAsPlayed
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="space-y-6 min-h-[600px] flex flex-col">
        {/* Stats Section in left column */}
        <LibraryStatsSection 
          totalGames={totalGames}
          unplayedGames={unplayedGames}
        />
        
        {/* Genres Section in left column - flex-grow to fill remaining space */}
        <div className="transition-transform duration-300 hover:scale-[1.01] flex-grow">
          <GenreHoarding 
            onGenreSelect={onGenreSelect} 
            activeGenre={activeGenre} 
          />
        </div>
      </div>
      
      {/* Shelf Life on right column - matching height */}
      <div className="transition-transform duration-300 hover:scale-[1.01] min-h-[600px]">
        <ShelfLife 
          onJumpToGame={onJumpToGame} 
          onMarkAsPlayed={onMarkAsPlayed} 
        />
      </div>
    </div>
  );
};

export default LibraryTopSection;

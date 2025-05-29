
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
      <div className="space-y-6">
        {/* Stats Section in left column */}
        <LibraryStatsSection 
          totalGames={totalGames}
          unplayedGames={unplayedGames}
        />
        
        {/* Genres Section in left column */}
        <div className="transition-transform duration-300 hover:scale-[1.01]">
          <GenreHoarding 
            onGenreSelect={onGenreSelect} 
            activeGenre={activeGenre} 
          />
        </div>
      </div>
      
      {/* Shelf Life on right column */}
      <div className="transition-transform duration-300 hover:scale-[1.01]">
        <ShelfLife 
          onJumpToGame={onJumpToGame} 
          onMarkAsPlayed={onMarkAsPlayed} 
        />
      </div>
    </div>
  );
};

export default LibraryTopSection;


import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LibraryStatsSection from '@/components/LibraryStatsSection';
import GenreHoarding from '@/components/GenreHoarding';
import ShelfLife from '@/components/ShelfLife';

interface LibraryTabbedSectionProps {
  totalGames: number;
  unplayedGames: number;
  activeGenre: string | null;
  onGenreSelect: (genre: string) => void;
  onJumpToGame: (gameId: number) => void;
  onMarkAsPlayed: (gameId: number) => void;
}

const LibraryTabbedSection: React.FC<LibraryTabbedSectionProps> = ({
  totalGames,
  unplayedGames,
  activeGenre,
  onGenreSelect,
  onJumpToGame,
  onMarkAsPlayed
}) => {
  return (
    <section className="w-full py-4 px-4 bg-black/30">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-unplayed-mint/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="genres" 
              className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
            >
              Genres
            </TabsTrigger>
            <TabsTrigger 
              value="shelf-life" 
              className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
            >
              Shelf Life
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <LibraryStatsSection
              totalGames={totalGames}
              unplayedGames={unplayedGames}
            />
          </TabsContent>
          
          <TabsContent value="genres" className="mt-6">
            <GenreHoarding
              onGenreSelect={onGenreSelect}
              activeGenre={activeGenre}
            />
          </TabsContent>
          
          <TabsContent value="shelf-life" className="mt-6">
            <ShelfLife
              onJumpToGame={onJumpToGame}
              onMarkAsPlayed={onMarkAsPlayed}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default LibraryTabbedSection;

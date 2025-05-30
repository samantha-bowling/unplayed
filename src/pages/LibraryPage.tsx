
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LibraryTabbedSection from "@/components/LibraryTabbedSection";
import LibraryHeroSection from "@/components/LibraryHeroSection";
import LibraryOverview from "@/components/LibraryOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibraryData } from "@/hooks/use-library-data";

const LibraryPage = () => {
  const { games: libraryGames, markAsPlayed } = useLibraryData();
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // Calculate stats from library data
  const totalGames = libraryGames.length;
  const unplayedGames = libraryGames.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime === 0;
  }).length;

  const handleGenreSelect = (genre: string) => {
    setActiveGenre(genre);
  };

  const handleJumpToGame = (gameId: number) => {
    // Implementation for jumping to a specific game
    console.log('Jump to game:', gameId);
  };

  const handleMarkAsPlayed = async (gameId: number) => {
    // Find the user game record and mark as played
    const game = libraryGames.find(g => g.id === gameId);
    if (game?.userGame?.id) {
      await markAsPlayed.mutateAsync({ userGameId: game.userGame.id });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <LibraryHeroSection 
            unplayedCount={unplayedGames}
            totalGames={totalGames}
          />
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-black/40 border border-unplayed-mint/20">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="games"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Games
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <LibraryOverview />
            </TabsContent>
            
            <TabsContent value="games" className="space-y-4">
              <LibraryTabbedSection 
                totalGames={totalGames}
                unplayedGames={unplayedGames}
                activeGenre={activeGenre}
                onGenreSelect={handleGenreSelect}
                onJumpToGame={handleJumpToGame}
                onMarkAsPlayed={handleMarkAsPlayed}
              />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-2">Advanced Insights</h3>
                <p className="text-gray-400">Coming soon: Advanced analytics and personalized recommendations</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LibraryPage;

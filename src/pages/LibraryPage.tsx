
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LibraryHeroSection from "@/components/LibraryHeroSection";
import LibraryOverview from "@/components/LibraryOverview";
import LibraryGamesTab from "@/components/LibraryGamesTab";
import LibraryGenresTab from "@/components/LibraryGenresTab";
import LibraryShelfLifeTab from "@/components/LibraryShelfLifeTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibraryData } from "@/hooks/use-library-data";

const LibraryPage = () => {
  const { games: libraryGames, markAsPlayed } = useLibraryData();

  // Calculate stats from library data
  const totalGames = libraryGames.length;
  const unplayedGames = libraryGames.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime === 0;
  }).length;

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
      
      {/* Hero section - Removed pt-24 to prevent double padding */}
      <section className="flex-grow px-4 py-12 text-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <LibraryHeroSection 
            unplayedCount={unplayedGames}
            totalGames={totalGames}
          />
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-black/40 border border-unplayed-mint/20">
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
            
            <TabsContent value="overview" className="space-y-4">
              <LibraryOverview />
            </TabsContent>
            
            <TabsContent value="games" className="space-y-4">
              <LibraryGamesTab />
            </TabsContent>
            
            <TabsContent value="genres" className="space-y-4">
              <LibraryGenresTab />
            </TabsContent>
            
            <TabsContent value="shelf-life" className="space-y-4">
              <LibraryShelfLifeTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LibraryPage;

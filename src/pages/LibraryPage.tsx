
import React, { useState } from 'react';
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
      <Helmet>
        <title>Your Game Library – unplayed</title>
        <meta name="description" content="Browse and manage your complete Steam library with advanced filtering, genre stats, and shelf life tracking." />
        <link rel="canonical" href="https://unplayed.lovable.app/library" />
        <meta property="og:url" content="https://unplayed.lovable.app/library" />
        <meta property="og:title" content="Your Game Library – unplayed" />
        <meta property="og:description" content="Browse and manage your complete Steam library with advanced filtering, genre stats, and shelf life tracking." />
        <meta property="og:image" content="https://storage.googleapis.com/gpt-engineer-file-uploads/gKolm4BO26SZgtzHFVTH9PMyhqV2/social-images/social-1759980433279-Screenshot 2025-10-04 082507.png" />
        <meta name="twitter:title" content="Your Game Library – unplayed" />
        <meta name="twitter:description" content="Browse and manage your complete Steam library with advanced filtering, genre stats, and shelf life tracking." />
      </Helmet>
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Your Game Library
            </h1>
            <p className="text-lg text-gray-300">
              Explore your complete Steam library with advanced filtering and organization tools.
            </p>
          </div>

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
      </main>
      
      <Footer />
    </div>
  );
};

export default LibraryPage;

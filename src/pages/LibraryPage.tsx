import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import LibraryPreview from '@/components/LibraryPreview';
import LibraryFilters from '@/components/LibraryFilters';
import GameGrid from '@/components/GameGrid';
import useLibraryData from '@/hooks/use-library-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';

const LibraryPage: React.FC = () => {
  const { isFullScreenMode, componentSettings } = useFullScreenMode();
  const { toast } = useToast();
  
  // Get library data and actions from our hook
  const { 
    games, 
    isLoading, 
    error,
    filters,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    resetFilters,
    sortBy,
    sortDirection,
    updateSort,
    markAsPlayed,
    toggleGameHidden,
    saveGameNote
  } = useLibraryData();

  // Handle mark as played action
  const handleMarkAsPlayed = (userGameId: string) => {
    markAsPlayed.mutate(
      { userGameId },
      {
        onSuccess: () => {
          toast({
            title: "Game marked as played",
            description: "Your game has been marked as played successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to mark game as played.",
            variant: "destructive",
          });
          console.error("Error marking game as played:", error);
        }
      }
    );
  };

  // Handle toggle hidden action
  const handleToggleHidden = (userGameId: string, hidden: boolean) => {
    toggleGameHidden.mutate(
      { userGameId, hidden },
      {
        onSuccess: () => {
          toast({
            title: hidden ? "Game hidden" : "Game unhidden",
            description: hidden 
              ? "This game has been hidden from your main view." 
              : "This game is now visible in your library.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update game visibility.",
            variant: "destructive",
          });
          console.error("Error toggling game visibility:", error);
        }
      }
    );
  };

  // Handle save note action
  const handleSaveNote = (userGameId: string, note: string) => {
    saveGameNote.mutate(
      { userGameId, note },
      {
        onSuccess: () => {
          toast({
            title: "Note saved",
            description: "Your game note has been saved successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to save game note.",
            variant: "destructive",
          });
          console.error("Error saving game note:", error);
        }
      }
    );
  };

  // In Full Screen Mode, render only the LibraryPreview component
  if (isFullScreenMode) {
    return (
      <FullScreenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <LibraryPreview zenModeFullScreen={true} />
          
          {/* Add Full Screen Mode toggle in the corner */}
          <div className="absolute top-4 right-4 z-10">
            <FullScreenModeToggle />
          </div>
        </div>
      </FullScreenModeWrapper>
    );
  }

  // Regular view with header and footer
  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8 header-spacing">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold font-space">
                <span className="text-unplayed-mint">Library</span>
                <span className="text-white">.exe</span>
              </h1>
              
              <div className="flex items-center space-x-2">
                <FullScreenModeToggle />
              </div>
            </div>
            
            {/* Library filters */}
            <LibraryFilters
              searchQuery={filters.search}
              onSearchChange={updateSearchFilter}
              hideIgnored={filters.hideIgnored}
              onHideIgnoredChange={toggleHideIgnored}
              onlyUnplayed={filters.onlyUnplayed}
              onOnlyUnplayedChange={toggleOnlyUnplayed}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={updateSort}
              onResetFilters={resetFilters}
            />
            
            {/* Game grid */}
            <GameGrid 
              games={games}
              isLoading={isLoading}
              onMarkAsPlayed={handleMarkAsPlayed}
              onToggleHidden={handleToggleHidden}
              onSaveNote={handleSaveNote}
            />

            {/* Error message */}
            {error && (
              <div className="my-8 p-4 border border-unplayed-red rounded-lg bg-unplayed-red/10 text-center">
                <p className="text-unplayed-red mb-2">Error loading your game library</p>
                <p className="text-sm text-gray-400 mb-4">{(error as Error).message}</p>
                <Button 
                  variant="outline" 
                  className="border-unplayed-red text-unplayed-red hover:bg-unplayed-red/10"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </FullScreenModeWrapper>
  );
};

export default withDemoIndicator(LibraryPage);

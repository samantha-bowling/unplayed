
import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { withDemoIndicator } from '@/components/withDemoIndicator';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import LibraryPreview from '@/components/LibraryPreview';
import LibraryFilters from '@/components/LibraryFilters';
import GameGrid from '@/components/GameGrid';
import UnplayedCounter from '@/components/UnplayedCounter';
import GenreHoarding from '@/components/GenreHoarding';
import ShelfLife from '@/components/ShelfLife';
import useLibraryData from '@/hooks/use-library-data';
import useUnplayedData from '@/hooks/use-unplayed-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LibraryPage: React.FC = () => {
  const { isFullScreenMode, componentSettings } = useFullScreenMode();
  const { toast } = useToast();
  const { data: unplayedData } = useUnplayedData();
  
  // Store reference to focused game for scrolling
  const [focusedGameId, setFocusedGameId] = useState<number | null>(null);
  const gameGridRef = useRef<HTMLDivElement>(null);
  
  // Get library data and actions from our hook
  const { 
    games, 
    isLoading, 
    error,
    filters,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    updateSelectedGenre,
    resetFilters,
    sortBy,
    sortDirection,
    updateSort,
    viewMode,
    updateViewMode,
    markAsPlayed,
    toggleGameHidden,
    saveGameNote,
    findGameById
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
  
  // Handle genre selection from the pie chart
  const handleGenreSelect = (genre: string) => {
    updateSelectedGenre(genre);
  };
  
  // Handle jumping to a game in the library
  const handleJumpToGame = (gameId: number) => {
    setFocusedGameId(gameId);
    
    // Scroll to game grid
    if (gameGridRef.current) {
      gameGridRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Set a timeout to highlight the game after scrolling
      setTimeout(() => {
        const gameElement = document.getElementById(`game-${gameId}`);
        if (gameElement) {
          gameElement.classList.add('highlight-game');
          setTimeout(() => {
            gameElement.classList.remove('highlight-game');
          }, 3000);
        }
      }, 500);
    }
  };

  // Reset focused game after a delay
  useEffect(() => {
    if (focusedGameId) {
      const timer = setTimeout(() => {
        setFocusedGameId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [focusedGameId]);

  // In Full Screen Mode, render only the LibraryPreview component
  if (isFullScreenMode) {
    return (
      <FullScreenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <LibraryPreview 
            zenModeFullScreen={true}
            viewMode={viewMode}
            onViewModeChange={updateViewMode}
          />
          
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
            
            {/* Backlog Command Center Header - Unplayed Summary Widget */}
            <div className="bg-black/30 border border-unplayed-mint/20 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-grow">
                  <h2 className="text-xl font-medium mb-1">
                    Welcome back, Commander of the Backlog
                  </h2>
                  <p className="text-gray-400">
                    Manage your unplayed games and conquer your backlog.
                  </p>
                </div>
                
                <div className="w-full md:w-auto">
                  <UnplayedCounter compact={true} />
                </div>
                
                <div className="w-full md:w-auto">
                  <Link to="/spend">
                    <Button variant="outline" className="w-full md:w-auto">
                      View My Most Expensive Unplayed
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Two-column layout for Genres and Shelf Life on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <GenreHoarding 
                onGenreSelect={handleGenreSelect} 
                activeGenre={filters.selectedGenre} 
              />
              <ShelfLife 
                onJumpToGame={handleJumpToGame} 
                onMarkAsPlayed={handleMarkAsPlayed} 
              />
            </div>
            
            {/* Library filters */}
            <LibraryFilters
              searchQuery={filters.search}
              onSearchChange={updateSearchFilter}
              hideIgnored={filters.hideIgnored}
              onHideIgnoredChange={toggleHideIgnored}
              onlyUnplayed={filters.onlyUnplayed}
              onOnlyUnplayedChange={toggleOnlyUnplayed}
              selectedGenre={filters.selectedGenre}
              onGenreChange={updateSelectedGenre}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={updateSort}
              onResetFilters={resetFilters}
            />
            
            {/* Section header for library */}
            <h2 className="text-xl font-medium mb-4 text-unplayed-mint">
              Explore Your Unplayed Realms
            </h2>
            
            {/* Library view toggle */}
            <div className="flex justify-end mb-4">
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateViewMode('grid')}
                  className={viewMode === 'grid' ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
                >
                  Grid View
                </Button>
                <Button
                  variant={viewMode === 'zen' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateViewMode('zen')}
                  className={viewMode === 'zen' ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
                >
                  Zen View
                </Button>
              </div>
            </div>
            
            {/* Game display - either grid or zen mode */}
            <div ref={gameGridRef}>
              {viewMode === 'grid' ? (
                <GameGrid 
                  games={games}
                  isLoading={isLoading}
                  onMarkAsPlayed={handleMarkAsPlayed}
                  onToggleHidden={handleToggleHidden}
                  onSaveNote={handleSaveNote}
                  focusedGameId={focusedGameId}
                />
              ) : (
                <LibraryPreview
                  viewMode="zen"
                  onViewModeChange={updateViewMode}
                  games={games}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-unplayed-mint" />
              </div>
            )}

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

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { ZenLayout } from '@/layouts';
import LibraryPreview from '@/components/LibraryPreview';
import LibraryWelcomeSection from '@/components/LibraryWelcomeSection';
import LibraryTopSection from '@/components/LibraryTopSection';
import LibraryContent from '@/components/LibraryContent';
import useLibraryData from '@/hooks/use-library-data';
import usePaginatedLibrary from '@/hooks/use-paginated-library';
import { useToast } from '@/hooks/use-toast';

const LibraryPage: React.FC = () => {
  const { isFullScreenMode } = useFullScreenMode();
  const { toast } = useToast();
  
  // Store reference to focused game for scrolling
  const [focusedGameId, setFocusedGameId] = useState<number | null>(null);
  
  // Default to using the optimized pagination mode
  const usePagination = true;
  
  // Get library data from our hooks
  const legacyData = useLibraryData();
  const paginatedData = usePaginatedLibrary();
  
  // Use the appropriate data source based on the pagination flag
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
  } = usePagination ? paginatedData : legacyData;
  
  // Also get view mode from legacy data
  const { viewMode, updateViewMode } = legacyData;

  // Calculate unplayed stats
  const totalGames = usePagination ? paginatedData.pagination.totalItems : games.length;
  const unplayedGames = games.filter(g => !g.userGame.playtime_minutes || g.userGame.playtime_minutes === 0).length;

  // Handle mark as played action
  const handleMarkAsPlayed = (userGameId: string) => {
    if (usePagination) {
      paginatedData.markAsPlayed(userGameId)
        .then(() => {
          toast({
            title: "Game marked as played",
            description: "Your game has been marked as played successfully.",
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to mark game as played.",
            variant: "destructive",
          });
          console.error("Error marking game as played:", error);
        });
    } else {
      legacyData.markAsPlayed.mutate(
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
    }
  };

  // Create a lookup function to find userGameId by game.id
  const findUserGameIdByGameId = (gameId: number): string | null => {
    const game = games.find(g => g.id === gameId);
    return game ? game.userGame.id : null;
  };

  // Wrapper for ShelfLife component that translates game_id to userGame.id
  const handleMarkAsPlayedFromShelf = (gameId: number) => {
    const userGameId = findUserGameIdByGameId(gameId);
    if (userGameId) {
      handleMarkAsPlayed(userGameId);
    } else {
      toast({
        title: "Error",
        description: "Could not find the game in your library.",
        variant: "destructive",
      });
    }
  };

  // Handle toggle hidden action
  const handleToggleHidden = (userGameId: string, hidden: boolean) => {
    if (usePagination) {
      paginatedData.toggleGameHidden(userGameId, hidden)
        .then(() => {
          toast({
            title: hidden ? "Game hidden" : "Game unhidden",
            description: hidden 
              ? "This game has been hidden from your main view." 
              : "This game is now visible in your library.",
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to update game visibility.",
            variant: "destructive",
          });
          console.error("Error toggling game visibility:", error);
        });
    } else {
      legacyData.toggleGameHidden.mutate(
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
    }
  };

  // Handle save note action
  const handleSaveNote = (userGameId: string, note: string) => {
    if (usePagination) {
      paginatedData.saveGameNote(userGameId, note)
        .then(() => {
          toast({
            title: "Note saved",
            description: "Your game note has been saved successfully.",
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to save game note.",
            variant: "destructive",
          });
          console.error("Error saving game note:", error);
        });
    } else {
      legacyData.saveGameNote.mutate(
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
    }
  };
  
  // Handle genre selection from the pie chart
  const handleGenreSelect = (genre: string) => {
    updateSelectedGenre(genre);
  };
  
  // Handle jumping to a game in the library
  const handleJumpToGame = (gameId: number) => {
    setFocusedGameId(gameId);
    
    // Set a timeout to highlight the game after component renders
    setTimeout(() => {
      const gameElement = document.getElementById(`game-${gameId}`);
      if (gameElement) {
        gameElement.scrollIntoView({ behavior: 'smooth' });
        gameElement.classList.add('highlight-game');
        gameElement.style.animation = 'pulse 2s ease-in-out 3';
        setTimeout(() => {
          gameElement.classList.remove('highlight-game');
          gameElement.style.animation = '';
        }, 6000);
      }
    }, 500);
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
      <ZenLayout>
        <LibraryPreview 
          zenModeFullScreen={true}
          viewMode={viewMode}
          onViewModeChange={updateViewMode}
        />
      </ZenLayout>
    );
  }

  // Regular view with header and footer
  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8 header-spacing">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold font-space">
                <span className="text-unplayed-mint">Library</span>
                <span className="text-white">.exe</span>
              </h1>
            </div>
            
            <LibraryWelcomeSection
              unplayedCount={unplayedGames}
              totalGames={totalGames}
            />

            <LibraryTopSection
              totalGames={totalGames}
              unplayedGames={unplayedGames}
              activeGenre={filters.selectedGenre}
              onGenreSelect={handleGenreSelect}
              onJumpToGame={handleJumpToGame}
              onMarkAsPlayed={handleMarkAsPlayedFromShelf}
            />
            
            <LibraryContent
              games={games}
              isLoading={isLoading}
              error={error}
              filters={filters}
              updateSearchFilter={updateSearchFilter}
              toggleHideIgnored={toggleHideIgnored}
              toggleOnlyUnplayed={toggleOnlyUnplayed}
              updateSelectedGenre={updateSelectedGenre}
              resetFilters={resetFilters}
              sortBy={sortBy}
              sortDirection={sortDirection}
              updateSort={updateSort}
              viewMode={viewMode}
              updateViewMode={updateViewMode}
              usePagination={usePagination}
              paginatedData={paginatedData}
              legacyData={legacyData}
              onMarkAsPlayed={handleMarkAsPlayed}
              onToggleHidden={handleToggleHidden}
              onSaveNote={handleSaveNote}
              focusedGameId={focusedGameId}
            />
          </div>
        </main>
        
        <Footer />
      </div>
    </FullScreenModeWrapper>
  );
};

export default LibraryPage;

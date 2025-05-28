import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { ZenLayout } from '@/layouts';
import LibraryPreview from '@/components/LibraryPreview';
import LibraryFilters from '@/components/LibraryFilters';
import LibraryStatsSection from '@/components/LibraryStatsSection';
import GameGrid from '@/components/GameGrid';
import PaginatedGameGrid from '@/components/PaginatedGameGrid';
import UnplayedCounter from '@/components/UnplayedCounter';
import GenreHoarding from '@/components/GenreHoarding';
import ShelfLife from '@/components/ShelfLife';
import useLibraryData from '@/hooks/use-library-data';
import usePaginatedLibrary from '@/hooks/use-paginated-library';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FullScreenModeToggle from '@/components/FullScreenModeToggle';
import { Link } from 'react-router-dom';
import { Loader2, Clock, Archive, Info, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LibraryPage: React.FC = () => {
  const { isFullScreenMode, componentSettings } = useFullScreenMode();
  const { toast } = useToast();
  const { data: unplayedData } = useUnplayedData();
  
  // Store reference to focused game for scrolling
  const [focusedGameId, setFocusedGameId] = useState<number | null>(null);
  const gameGridRef = useRef<HTMLDivElement>(null);
  
  // Flag to toggle between legacy and paginated mode
  const [usePagination, setUsePagination] = useState<boolean>(true);
  
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

  // Get motivational message based on library size
  const getMotivationalMessage = () => {
    const gameCount = games.length;
    const unplayedCount = games.filter(g => !g.userGame.playtime_minutes || g.userGame.playtime_minutes === 0).length;
    
    if (unplayedCount === 0) return "Impressive! You've played all your games. Time to add more?";
    if (unplayedCount <= 5) return "You're so close to tackling your entire backlog. Keep it up!";
    if (unplayedCount <= 20) return "Your backlog is manageable. Pick something from the Shelf Life section!";
    if (unplayedCount <= 50) return "You've got quite the collection. Try the Random Picker to decide what's next!";
    return "That's an epic backlog! Let's organize and conquer it one game at a time.";
  };

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
    
    // Scroll to game grid when selecting a genre
    if (gameGridRef.current) {
      setTimeout(() => {
        gameGridRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
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
          // Create a pulsing effect
          gameElement.style.animation = 'pulse 2s ease-in-out 3';
          setTimeout(() => {
            gameElement.classList.remove('highlight-game');
            gameElement.style.animation = '';
          }, 6000);
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold font-space">
                <span className="text-unplayed-mint">Library</span>
                <span className="text-white">.exe</span>
              </h1>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant={usePagination ? "default" : "outline"}
                  onClick={() => setUsePagination(true)}
                  className={usePagination ? "bg-unplayed-amber/80 hover:bg-unplayed-amber" : ""}
                >
                  Optimized Mode
                </Button>
                <Button 
                  size="sm" 
                  variant={!usePagination ? "default" : "outline"}
                  onClick={() => setUsePagination(false)}
                  className={!usePagination ? "bg-unplayed-amber/80 hover:bg-unplayed-amber" : ""}
                >
                  Legacy Mode
                </Button>
                <FullScreenModeToggle />
              </div>
            </div>
            
            {/* Simplified Backlog Command Center Header */}
            <div className="bg-black/30 border border-unplayed-mint/20 rounded-lg p-4 mb-6 transform transition-all duration-300 hover:border-unplayed-mint/40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-grow">
                  <h2 className="text-xl font-medium mb-1 flex items-center">
                    <span>Welcome back, Commander of the Backlog</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="ml-2 text-unplayed-mint/60 hover:text-unplayed-mint transition-colors">
                            <Info size={16} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm">Your game library at a glance. Use the tools below to explore and organize your collection.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h2>
                  <p className="text-gray-400">
                    {getMotivationalMessage()}
                  </p>
                </div>
                
                <div className="w-full md:w-auto">
                  <Link to="/spend">
                    <Button variant="outline" className="w-full md:w-auto">
                      <Archive className="mr-2 h-4 w-4" />
                      View Most Expensive Unplayed
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* New Enhanced Stats Section */}
            <LibraryStatsSection 
              totalGames={totalGames}
              unplayedGames={unplayedGames}
            />
            
            {/* Two-column layout for Genres and Shelf Life with improved alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="transition-transform duration-300 hover:scale-[1.01] h-fit">
                <GenreHoarding 
                  onGenreSelect={handleGenreSelect} 
                  activeGenre={filters.selectedGenre} 
                />
              </div>
              <div className="transition-transform duration-300 hover:scale-[1.01] h-fit">
                <ShelfLife 
                  onJumpToGame={handleJumpToGame} 
                  onMarkAsPlayed={handleMarkAsPlayedFromShelf} 
                />
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
              selectedGenre={filters.selectedGenre}
              onGenreChange={updateSelectedGenre}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={updateSort}
              onResetFilters={resetFilters}
            />
            
            {/* Section header for library with game count */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-unplayed-mint flex items-center">
                <Sparkles className="mr-2 h-4 w-4" />
                Explore Your Collection
                {!isLoading && games.length > 0 && (
                  <span className="ml-2 text-sm text-gray-400">
                    ({usePagination ? `${paginatedData.pagination.totalItems} games` : `${games.length} games`})
                  </span>
                )}
              </h2>
              
              {/* Library view toggle */}
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateViewMode('grid')}
                  className={viewMode === 'grid' ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-all" : "transition-all"}
                >
                  Grid View
                </Button>
                <Button
                  variant={viewMode === 'zen' ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateViewMode('zen')}
                  className={viewMode === 'zen' ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-all" : "transition-all"}
                >
                  Zen View
                </Button>
              </div>
            </div>
            
            {/* Game display - either grid or zen mode */}
            <div ref={gameGridRef}>
              {viewMode === 'grid' ? (
                usePagination ? (
                  <PaginatedGameGrid 
                    games={paginatedData.games}
                    isLoading={paginatedData.isLoading}
                    onMarkAsPlayed={handleMarkAsPlayed}
                    onToggleHidden={handleToggleHidden}
                    onSaveNote={handleSaveNote}
                    focusedGameId={focusedGameId}
                    pagination={paginatedData.pagination}
                    goToPage={paginatedData.goToPage}
                    nextPage={paginatedData.nextPage}
                    previousPage={paginatedData.previousPage}
                    setPageSize={paginatedData.setPageSize}
                  />
                ) : (
                  <GameGrid 
                    games={legacyData.games}
                    isLoading={legacyData.isLoading}
                    onMarkAsPlayed={handleMarkAsPlayed}
                    onToggleHidden={handleToggleHidden}
                    onSaveNote={handleSaveNote}
                    focusedGameId={focusedGameId}
                  />
                )
              ) : (
                <LibraryPreview
                  viewMode="zen"
                  onViewModeChange={updateViewMode}
                  games={games}
                  isLoading={isLoading}
                />
              )}
            </div>

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

export default LibraryPage;

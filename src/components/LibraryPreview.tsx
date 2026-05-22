
import React, { useState, useMemo } from 'react';
import { Grid, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';
import SteamLoader from './SteamLoader';
import GameCard from './GameCard';
import { devLog } from '../lib/dev-log';

interface LibraryPreviewProps {
  zenModeFullScreen?: boolean;
}

const LibraryPreview: React.FC<LibraryPreviewProps> = ({ zenModeFullScreen = false }) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const [limit, setLimit] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [hideIgnored, setHideIgnored] = useState<boolean>(false);
  const [onlyUnplayed, setOnlyUnplayed] = useState<boolean>(false);

  // Use the library data hook without any limits
  const libraryDataResult = useLibraryData();

  // In demo mode, use demo library data; otherwise use ALL real data (no 1000 limit)
  const libraryGames = useMemo(() => {
    if (isDemo) {
      // Convert demo data to the expected format
      return demoData.library.map(game => ({
        id: game.id,
        name: game.name,
        image_url: game.image,
        header_image: game.image,
        release_date: null,
        metacritic_score: null,
        genres: [],
        categories: [],
        userGame: {
          id: `demo-${game.id}`,
          game_id: game.id,
          playtime_minutes: game.playtime,
          hidden: false,
          dust_score: Math.floor(Math.random() * 50) + 10,
          last_played_date: null,
          acquisition_date: null,
          notes: null,
        }
      }));
    }
    // REMOVED: No more artificial limit - use all games from library
    return libraryDataResult.games || [];
  }, [isDemo, demoData.library, libraryDataResult.games]);

  const isLoading = isDemo ? false : libraryDataResult.isLoading;
  const error = isDemo ? null : libraryDataResult.error;

  // Apply filters to the games
  const filteredGames = useMemo(() => {
    let filtered = [...libraryGames];
    
    // Apply search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter out ignored games if hideIgnored is true
    if (hideIgnored) {
      filtered = filtered.filter(game => !game.userGame.hidden);
    }

    // Filter to only unplayed games if onlyUnplayed is true
    if (onlyUnplayed) {
      filtered = filtered.filter(game => 
        !game.userGame.playtime_minutes || game.userGame.playtime_minutes === 0
      );
    }

    return filtered;
  }, [libraryGames, searchFilter, hideIgnored, onlyUnplayed]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredGames.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const currentPageGames = filteredGames.slice(startIndex, endIndex);

  // Memoize processed games for performance
  const processedGames = useMemo(() => {
    return currentPageGames.map(game => ({
      ...game,
      imageUrl: getBestGameImageFromDbData(game, game.id)
    }));
  }, [currentPageGames]);

  const handleMarkAsPlayed = async (userGameId: string) => {
    if (isDemo) {
      devLog('Demo mode: Mark as played:', userGameId);
      return;
    }
    // Implementation for marking as played
    devLog('Mark as played:', userGameId);
  };

  const handleToggleHidden = async (userGameId: string, currentHidden: boolean) => {
    if (isDemo) {
      devLog('Demo mode: Toggle hidden:', userGameId, !currentHidden);
      return;
    }
    // Implementation for toggling hidden
    devLog('Toggle hidden:', userGameId, !currentHidden);
  };

  const handleSaveNote = async (userGameId: string, note: string) => {
    if (isDemo) {
      devLog('Demo mode: Save note:', userGameId, note);
      return;
    }
    // Implementation for saving note
    devLog('Save note:', userGameId, note);
  };

  const resetFilters = () => {
    setSearchFilter('');
    setHideIgnored(false);
    setOnlyUnplayed(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const previousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, hideIgnored, onlyUnplayed, limit]);

  return (
    <div className="terminal-container">
      <div className="flex items-center justify-between mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="terminal-header text-2xl cursor-help">Library Preview</h3>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a preview of your library. Visit the Library tab to see your full library with advanced features.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="96">96</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Games to show</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search games..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10"
              aria-label="Search games"
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex gap-2">
          <Button
            variant={onlyUnplayed ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyUnplayed(!onlyUnplayed)}
            aria-pressed={onlyUnplayed}
          >
            Only Unplayed
          </Button>
          <Button
            variant={hideIgnored ? "default" : "outline"}
            size="sm"
            onClick={() => setHideIgnored(!hideIgnored)}
            aria-pressed={hideIgnored}
          >
            Hide Ignored
          </Button>
          {(searchFilter || onlyUnplayed || hideIgnored) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>
          Showing {processedGames.length} of {filteredGames.length} games
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      <div className="terminal-content">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <SteamLoader message="Loading your library..." size="md" variant="secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>Error loading library: {error.message}</p>
          </div>
        ) : processedGames.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No games found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {processedGames.map(game => (
              <GameCard
                key={game.userGame.id}
                id={game.userGame.id}
                gameId={game.id}
                title={game.name}
                imageUrl={game.imageUrl}
                headerImage={game.header_image}
                dustScore={game.userGame.dust_score}
                playtimeMinutes={game.userGame.playtime_minutes}
                isHidden={game.userGame.hidden}
                notes={game.userGame.notes}
                onMarkAsPlayed={() => handleMarkAsPlayed(game.userGame.id)}
                onToggleHidden={() => handleToggleHidden(game.userGame.id, game.userGame.hidden || false)}
                onSaveNote={(note) => handleSaveNote(game.userGame.id, note)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="w-10 h-10 sm:w-8 sm:h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPreview;

import React, { useState, useMemo } from 'react';
import { Play, Grid, List, Maximize, Eye, EyeOff, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';
import SteamLoader from './SteamLoader';
import GameCard from './GameCard';
import FloatingIcons from './FloatingIcons';
import FloatingGameNames from './FloatingGameNames';
import ZenLayout from '@/layouts/ZenLayout';

interface LibraryPreviewProps {
  zenModeFullScreen?: boolean;
}

const LibraryPreview: React.FC<LibraryPreviewProps> = ({ zenModeFullScreen = false }) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>('grid');
  const [limit, setLimit] = useState<number>(12);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [hideIgnored, setHideIgnored] = useState<boolean>(false);
  const [onlyUnplayed, setOnlyUnplayed] = useState<boolean>(false);

  // Use the library data hook only when not in demo mode
  const libraryDataResult = useLibraryData();

  // In demo mode, use demo library data; otherwise use real data
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
          dust_score: Math.floor(Math.random() * 50) + 10, // Random dust score for demo
          last_played_date: null,
          acquisition_date: null,
          notes: null,
        }
      }));
    }
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

  // Memoize processed games for performance
  const processedGames = useMemo(() => {
    const limitedGames = viewMode === 'zen' ? filteredGames : filteredGames.slice(0, limit);
    
    return limitedGames.map(game => ({
      ...game,
      imageUrl: getBestGameImageFromDbData(game, game.id)
    }));
  }, [filteredGames, limit, viewMode]);

  // Extract game names for zen mode - use ALL games, not filtered ones
  const gameNames = useMemo(() => {
    return libraryGames.map(game => game.name);
  }, [libraryGames]);

  const handleMarkAsPlayed = async (userGameId: string) => {
    if (isDemo) {
      console.log('Demo mode: Mark as played:', userGameId);
      return;
    }
    // Implementation for marking as played
    console.log('Mark as played:', userGameId);
  };

  const handleToggleHidden = async (userGameId: string, currentHidden: boolean) => {
    if (isDemo) {
      console.log('Demo mode: Toggle hidden:', userGameId, !currentHidden);
      return;
    }
    // Implementation for toggling hidden
    console.log('Toggle hidden:', userGameId, !currentHidden);
  };

  const handleSaveNote = async (userGameId: string, note: string) => {
    if (isDemo) {
      console.log('Demo mode: Save note:', userGameId, note);
      return;
    }
    // Implementation for saving note
    console.log('Save note:', userGameId, note);
  };

  const resetFilters = () => {
    setSearchFilter('');
    setHideIgnored(false);
    setOnlyUnplayed(false);
  };

  if (zenModeFullScreen || viewMode === 'zen') {
    return (
      <ZenLayout>
        <div className="w-full h-full relative">
          {/* Only show header and controls when NOT in full screen mode */}
          {!isFullScreenMode && (
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-white">Zen Mode - Library</h2>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullScreenMode}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle Full Screen Mode</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Exit Zen
                </Button>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12 relative z-10">
              <SteamLoader message="Loading your library..." size="md" variant="secondary" />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <FloatingIcons count={25} />
              <FloatingGameNames gameNames={gameNames} count={Math.min(15, gameNames.length)} />
            </div>
          )}
        </div>
      </ZenLayout>
    );
  }

  return (
    <div className="terminal-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Library Preview</h3>
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
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Games to show</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as 'grid' | 'zen')}>
            <ToggleGroupItem value="grid" aria-label="Grid View">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="zen" aria-label="Zen View">
              <Eye className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
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
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex gap-2">
          <Button
            variant={onlyUnplayed ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyUnplayed(!onlyUnplayed)}
          >
            Only Unplayed
          </Button>
          <Button
            variant={hideIgnored ? "default" : "outline"}
            size="sm"
            onClick={() => setHideIgnored(!hideIgnored)}
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
      </div>
    </div>
  );
};

export default LibraryPreview;

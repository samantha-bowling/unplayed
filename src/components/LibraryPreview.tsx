import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Expand, Minimize, Filter, Grid3X3, List, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useLibraryData } from '@/hooks/useLibraryData';
import { useRandomPicker } from '@/hooks/useRandomPicker';
import { getBestGameImage } from '@/utils/image-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LibraryPreviewProps {
  zenModeFullScreen?: boolean;
}

const LibraryPreview: React.FC<LibraryPreviewProps> = ({ zenModeFullScreen = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnplayedOnly, setShowUnplayedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { enterFullScreenMode, exitFullScreenMode, isFullScreenMode } = useFullScreenMode();
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: libraryData, isLoading } = useLibraryData();
  const { pickRandomGame } = useRandomPicker();

  const displayData = useMemo(() => {
    if (isDemo) {
      return demoData.library || [];
    }
    return libraryData || [];
  }, [isDemo, demoData.library, libraryData]);

  const filteredGames = useMemo(() => {
    return displayData
      .filter(game => {
        const matchesSearch = !searchTerm || 
          game.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = !showUnplayedOnly || game.playtime === 0;
        return matchesSearch && matchesFilter;
      })
      .slice(0, zenModeFullScreen ? 200 : 20);
  }, [displayData, searchTerm, showUnplayedOnly, zenModeFullScreen]);

  const handleToggleFullScreen = () => {
    if (isFullScreenMode) {
      exitFullScreenMode();
    } else {
      enterFullScreenMode('library');
    }
  };

  const handleRandomPick = () => {
    const unplayedGames = displayData.filter(game => game.playtime === 0);
    const gamesToPick = unplayedGames.length > 0 ? unplayedGames : displayData;
    
    if (gamesToPick.length > 0) {
      const randomGame = gamesToPick[Math.floor(Math.random() * gamesToPick.length)];
      pickRandomGame({
        id: randomGame.id,
        name: randomGame.name,
        image: randomGame.image
      });
    }
  };

  if (isLoading) {
    return (
      <div className="terminal-container">
        <h3 className="terminal-header text-2xl mb-4">Library Preview</h3>
        <div className="terminal-content">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-700 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (zenModeFullScreen) {
    return (
      <div className="w-full h-screen bg-background p-4 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-unplayed-mint">Library Zen Mode</h1>
            <span className="text-gray-400">({filteredGames.length} games shown)</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button
              onClick={() => setShowUnplayedOnly(!showUnplayedOnly)}
              variant={showUnplayedOnly ? "default" : "outline"}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Unplayed Only
            </Button>
            <Button onClick={handleToggleFullScreen} size="sm">
              <Minimize className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {filteredGames.map(game => (
            <div key={game.id} className="group relative">
              <div className="aspect-square bg-gray-800 rounded overflow-hidden">
                <img
                  src={getBestGameImage(null, game.image, game.id)}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                <span className="text-white text-xs text-center px-2 leading-tight">
                  {game.name}
                </span>
              </div>
              {game.playtime === 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-unplayed-mint rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container">
      <div className="flex items-center justify-between mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <h3 className="terminal-header text-2xl">Library Preview</h3>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visit your Library to see your entire collection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/library">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Library
              </Button>
            </Link>
          )}
          <Button
            onClick={handleToggleFullScreen}
            variant="outline"
            size="sm"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="terminal-content">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/20 border-gray-600"
            />
          </div>
          <Button
            onClick={() => setShowUnplayedOnly(!showUnplayedOnly)}
            variant={showUnplayedOnly ? "default" : "outline"}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showUnplayedOnly ? "All Games" : "Unplayed Only"}
          </Button>
          <Button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            variant="outline"
            size="sm"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
            {filteredGames.map(game => (
              <div key={game.id} className="group relative">
                <div className="aspect-square bg-gray-800 rounded overflow-hidden">
                  <img
                    src={getBestGameImage(null, game.image, game.id)}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <span className="text-white text-xs text-center px-2 leading-tight">
                    {game.name}
                  </span>
                </div>
                {game.playtime === 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-unplayed-mint rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {filteredGames.map(game => (
              <div key={game.id} className="flex items-center gap-3 p-2 rounded bg-black/20 hover:bg-black/30 transition-colors">
                <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={getBestGameImage(null, game.image, game.id)}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{game.name}</div>
                  <div className="text-xs text-gray-400">
                    {game.playtime === 0 ? 'Unplayed' : `${Math.round(game.playtime / 60)}h played`}
                  </div>
                </div>
                {game.playtime === 0 && (
                  <div className="w-2 h-2 bg-unplayed-mint rounded-full flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Showing {filteredGames.length} of {displayData.length} games</span>
          <div className="flex gap-2">
            {filteredGames.length > 0 && (
              <Button onClick={handleRandomPick} size="sm">
                Random Pick
              </Button>
            )}
            {!isDemo && (
              <p className="text-xs text-gray-500">
                Connect Steam to see your full library
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPreview;

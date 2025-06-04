
import React, { useMemo, useState } from 'react';
import { useLibraryData } from '@/hooks/use-library-data';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Maximize2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBestGameImageFromDbData } from '@/utils/image-utils';

interface LibraryPreviewProps {
  zenModeFullScreen?: boolean;
}

const LibraryPreview = React.memo<LibraryPreviewProps>(({ zenModeFullScreen = false }) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { games: libraryGames, isLoading } = useLibraryData();
  const { setFullScreenMode, setFocusedComponent } = useFullScreenMode();
  const [showHidden, setShowHidden] = useState(false);

  // Process games data consistently - show ALL games, not limited subset
  const processedGames = useMemo(() => {
    let gamesToProcess = [];
    
    if (isDemo) {
      // Use demo data games list
      gamesToProcess = demoData.gamesList || [];
    } else {
      // Use all library games - remove any artificial limits
      gamesToProcess = libraryGames || [];
    }

    // Filter based on hidden state
    const filteredGames = showHidden 
      ? gamesToProcess 
      : gamesToProcess.filter(game => !game.userGame?.hidden);

    console.log('LibraryPreview Debug:', {
      totalLibraryGames: libraryGames?.length || 0,
      demoGamesCount: demoData.gamesList?.length || 0,
      filteredGamesCount: filteredGames.length,
      showHidden,
      isDemo
    });

    // Sort by dust score (highest first) and return ALL games
    return filteredGames
      .sort((a, b) => {
        const dustA = a.userGame?.dust_score || 0;
        const dustB = b.userGame?.dust_score || 0;
        return dustB - dustA;
      });
  }, [libraryGames, demoData.gamesList, showHidden, isDemo]);

  const handleFullScreen = () => {
    setFocusedComponent('library');
    setFullScreenMode(true);
  };

  const toggleHiddenGames = () => {
    setShowHidden(!showHidden);
  };

  if (isLoading && !isDemo) {
    return (
      <div className="terminal-container">
        <h3 className="terminal-header text-2xl mb-4">Library Preview</h3>
        <div className="terminal-content p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unplayed-mint"></div>
            <span className="ml-3 text-gray-400">Loading your library...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!processedGames.length) {
    return (
      <div className="terminal-container">
        <h3 className="terminal-header text-2xl mb-4">Library Preview</h3>
        <div className="terminal-content p-8 text-center">
          <p className="text-gray-400 mb-4">No games found in your library.</p>
          {user && !isDemo && (
            <p className="text-sm text-gray-500">
              Import your Steam library to see your games here.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (zenModeFullScreen) {
    return (
      <div className="w-full h-full overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {processedGames.map((game) => {
            const imageUrl = getBestGameImageFromDbData(game, game.id);
            const dustScore = game.userGame?.dust_score || 0;
            
            return (
              <Card key={game.id} className="bg-black/40 border-gray-700 hover:border-unplayed-mint/50 transition-colors">
                <CardContent className="p-2">
                  <div className="aspect-[460/215] relative mb-2">
                    <img
                      src={imageUrl || '/placeholder.svg'}
                      alt={game.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {dustScore > 0 && (
                      <div className="absolute top-1 right-1 bg-unplayed-pink text-white text-xs px-1 py-0.5 rounded">
                        {dustScore}
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white truncate" title={game.name}>
                    {game.name}
                  </h4>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Show first 12 games in preview mode, but indicate total count
  const previewGames = processedGames.slice(0, 12);
  const totalCount = processedGames.length;

  return (
    <div className="terminal-container">
      <div className="flex justify-between items-center mb-4">
        <h3 className="terminal-header text-2xl mb-0">Library Preview</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHiddenGames}
            className="text-xs bg-black/50 border-gray-700 hover:bg-black/70"
          >
            {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            {showHidden ? 'Hide Hidden' : 'Show Hidden'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullScreen}
            className="text-xs bg-black/50 border-gray-700 hover:bg-black/70"
          >
            <Maximize2 size={14} className="mr-1" />
            Full View
          </Button>
        </div>
      </div>

      <div className="terminal-content">
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-400">
            Showing {previewGames.length} of {totalCount.toLocaleString()} games
            {!showHidden && ' (hidden games excluded)'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {previewGames.map((game) => {
            const imageUrl = getBestGameImageFromDbData(game, game.id);
            const dustScore = game.userGame?.dust_score || 0;
            const isHidden = game.userGame?.hidden || false;
            
            return (
              <Card 
                key={game.id} 
                className={`bg-black/40 border-gray-700 hover:border-unplayed-mint/50 transition-colors ${
                  isHidden ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-2">
                  <div className="aspect-[460/215] relative mb-2">
                    <img
                      src={imageUrl || '/placeholder.svg'}
                      alt={game.name}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {dustScore > 0 && (
                      <div className="absolute top-1 right-1 bg-unplayed-pink text-white text-xs px-1 py-0.5 rounded">
                        {dustScore}
                      </div>
                    )}
                    {isHidden && (
                      <div className="absolute bottom-1 left-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                        Hidden
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white truncate" title={game.name}>
                    {game.name}
                  </h4>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link 
            to="/library" 
            className="inline-flex items-center px-4 py-2 bg-unplayed-mint text-black rounded-md hover:bg-unplayed-mint/90 transition-colors font-medium"
          >
            View Full Library ({totalCount.toLocaleString()} games)
          </Link>
        </div>
      </div>
    </div>
  );
});

LibraryPreview.displayName = 'LibraryPreview';

export default LibraryPreview;

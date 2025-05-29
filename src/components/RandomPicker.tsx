
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useSessionPicker } from '@/hooks/use-session-picker';
import GameSpinner from '@/components/GameSpinner';
import SelectedGame from '@/components/SelectedGame';
import RecentPick from '@/components/RecentPick';
import MoodFilterDropdown from '@/components/MoodFilterDropdown';
import PreviouslyPickedBadge from '@/components/PreviouslyPickedBadge';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RandomPickerProps extends WithDemoProps {
  fullScreen?: boolean;
}

const RandomPicker = React.memo<RandomPickerProps>(({ 
  isDemo = false, 
  fullScreen = false 
}: RandomPickerProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth();
  
  const { 
    games: availableGames,
    isLoading: pickerLoading,
    scope,
    setScope,
    activeMood,
    setActiveMood,
    preventDuplicates,
    setPreventDuplicates,
    selectRandomGame,
    currentSessionPick,
    previousSessionPick,
    hasPickedInSession,
    resetSessionState
  } = useSessionPicker();

  const handleSpin = useCallback(() => {
    if (availableGames.length === 0) {
      toast.error("No games available to pick!");
      return;
    }

    setIsSpinning(true);
    resetSessionState();

    setTimeout(() => {
      selectRandomGame();
      setIsSpinning(false);
    }, 1500);
  }, [availableGames, selectRandomGame, resetSessionState]);

  const handleNewSpin = useCallback(() => {
    resetSessionState();
    handleSpin();
  }, [handleSpin, resetSessionState]);

  const handlePlayGame = useCallback(() => {
    if (!currentSessionPick) return;
    
    // Open Steam game
    const steamUrl = `steam://rungameid/${currentSessionPick.id}`;
    window.location.href = steamUrl;
    
    toast.success("Opening game in Steam!");
  }, [currentSessionPick]);

  const handleSelectMood = useCallback((moodId: string) => {
    setActiveMood(moodId);
    setIsDropdownOpen(false);
  }, [setActiveMood]);

  const handleClearMood = useCallback(() => {
    setActiveMood(null);
    setIsDropdownOpen(false);
  }, [setActiveMood]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const handleScopeChange = useCallback((newScope: 'unplayed' | 'all') => {
    setScope(newScope);
    resetSessionState();
  }, [setScope, resetSessionState]);

  const handlePreventDuplicatesChange = useCallback((checked: boolean) => {
    setPreventDuplicates(checked);
  }, [setPreventDuplicates]);

  return (
    <div className={`terminal-container w-full ${fullScreen ? 'h-screen' : 'h-[600px]'} flex flex-col p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Random Game Picker</h3>
      </div>
      
      {/* Controls Section */}
      <div className="space-y-4 mb-4">
        {/* Scope Toggle and Prevent Duplicates */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={scope === 'unplayed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleScopeChange('unplayed')}
              className={scope === 'unplayed' ? 'bg-unplayed-mint text-black' : ''}
            >
              Unplayed Only
            </Button>
            <Button
              variant={scope === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleScopeChange('all')}
              className={scope === 'all' ? 'bg-unplayed-mint text-black' : ''}
            >
              Full Library
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="prevent-duplicates"
              checked={preventDuplicates}
              onChange={(e) => handlePreventDuplicatesChange(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="prevent-duplicates" className="text-sm text-gray-300">
              Prevent duplicates
            </label>
          </div>
        </div>

        {/* Mood Filter */}
        <MoodFilterDropdown 
          activeMood={activeMood}
          onSelectMood={handleSelectMood}
          onClearMood={handleClearMood}
          isDropdownOpen={isDropdownOpen}
          toggleDropdown={toggleDropdown}
        />
      </div>

      {pickerLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unplayed-mint mx-auto mb-2"></div>
            <p className="text-gray-400">Loading your unplayed games...</p>
          </div>
        </div>
      ) : !user && !isDemo ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-gray-400 mb-4">Sign in to access your game library</p>
          </div>
        </div>
      ) : availableGames.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-gray-400 mb-2">No unplayed games found</p>
            <p className="text-sm text-gray-500">
              {activeMood ? `Try a different mood filter or add more games to your library` : 'Add some games to your library first'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center">
            {currentSessionPick ? (
              <div className="w-full max-w-2xl">
                <SelectedGame 
                  game={currentSessionPick} 
                  onPlayGame={handlePlayGame}
                  onRollAgain={handleNewSpin}
                  disabled={isSpinning}
                  headerMessage="Your Random Pick"
                  isDemo={isDemo}
                />
              </div>
            ) : isSpinning ? (
              <GameSpinner 
                quip="Finding your next adventure..."
                source={activeMood ? `${activeMood} games` : scope === 'unplayed' ? 'unplayed games' : 'all games'}
              />
            ) : (
              <div className="text-center">
                <Button 
                  onClick={handleSpin}
                  className="btn-amber text-lg px-8 py-3"
                  disabled={isSpinning}
                >
                  Spin for a Game
                </Button>
                <p className="text-gray-400 mt-2 text-sm">
                  {availableGames.length} {scope === 'unplayed' ? 'unplayed' : ''} games available
                  {activeMood && ` (filtered by ${activeMood})`}
                </p>
              </div>
            )}
          </div>

          {/* Recently Picked Section */}
          {previousSessionPick && !isSpinning && (
            <div className="mt-4">
              <RecentPick 
                recentPick={{
                  id: `session-${Date.now()}`,
                  game_id: previousSessionPick.id,
                  picked_at: new Date().toISOString(),
                  filters: { mood: activeMood || undefined },
                  game: {
                    id: previousSessionPick.id,
                    name: previousSessionPick.name,
                    image_url: previousSessionPick.image,
                    header_image: previousSessionPick.header_image || null,
                    release_date: previousSessionPick.releaseDate || null,
                    price_cents: previousSessionPick.price ? previousSessionPick.price * 100 : null,
                    genres: previousSessionPick.genres || null,
                    categories: previousSessionPick.categories || null,
                    description: previousSessionPick.description || null,
                    developer: previousSessionPick.developer || null,
                    publisher: previousSessionPick.publisher || null,
                  }
                }}
                isDemo={isDemo}
              />
            </div>
          )}
        </>
      )}

      {isDemo && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <p className="text-sm text-unplayed-mint">
            You're in Demo Mode. Sign in to pick from your actual Steam library.
          </p>
        </div>
      )}
    </div>
  );
});

RandomPicker.displayName = 'RandomPicker';

export default withDemoIndicator(RandomPicker);

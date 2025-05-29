
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
  const { user } = useAuth();
  
  const { 
    games: availableGames,
    isLoading: pickerLoading,
    activeMood,
    setActiveMood,
    selectRandomGame,
    currentSessionPick,
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

  return (
    <div className={`terminal-container w-full ${fullScreen ? 'h-screen' : 'h-[600px]'} flex flex-col p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Select Game</h3>
      </div>
      
      <div className="space-y-4 mb-4">
        <MoodFilterDropdown 
          value={activeMood || ''} 
          onValueChange={setActiveMood} 
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
                source={activeMood ? `${activeMood} games` : 'unplayed games'}
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
                  {availableGames.length} unplayed games available
                  {activeMood && ` (filtered by ${activeMood})`}
                </p>
              </div>
            )}
          </div>
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

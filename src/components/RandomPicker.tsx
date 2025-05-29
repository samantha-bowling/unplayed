import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { usePickerData } from '@/hooks/use-picker-data';
import { useGamePicks } from '@/hooks/use-game-picks';
import { usePreviouslyPicked } from '@/hooks/use-previously-picked';
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
  const [currentMood, setCurrentMood] = useState<string>('');
  const { user } = useAuth();
  
  const { data: pickerData, isLoading: pickerLoading } = usePickerData();
  const { createGamePick } = useGamePicks();
  const { checkPreviouslyPicked, isLoading: previouslyPickedLoading } = usePreviouslyPicked();
  const { 
    currentPick, 
    recentPick, 
    isLoadingPick,
    spinForGame,
    clearCurrentPick,
    refreshRecentPick 
  } = useSessionPicker();

  const availableGames = useMemo(() => {
    if (!pickerData?.gamesList) return [];
    
    let filteredGames = [...pickerData.gamesList];
    
    if (currentMood) {
      filteredGames = filteredGames.filter(game => game.genres.includes(currentMood));
    }
    
    return filteredGames;
  }, [pickerData?.gamesList, currentMood]);

  const isPreviouslyPicked = useMemo(() => {
    if (!currentPick) return false;
    return checkPreviouslyPicked(currentPick.id);
  }, [currentPick, checkPreviouslyPicked]);

  const handleSpin = useCallback(() => {
    if (availableGames.length === 0) {
      toast.error("No games available to pick!");
      return;
    }

    setIsSpinning(true);
    clearCurrentPick();

    setTimeout(() => {
      spinForGame(availableGames, currentMood);
      setIsSpinning(false);
    }, 1500);
  }, [availableGames, spinForGame, clearCurrentPick, currentMood]);

  const handleNewSpin = useCallback(() => {
    clearCurrentPick();
    handleSpin();
  }, [handleSpin, clearCurrentPick]);

  const handleAcceptPick = useCallback(async () => {
    if (!currentPick) return;

    try {
      await createGamePick({
        game_id: currentPick.id,
        filters: {
          mood: currentMood
        }
      });
      toast.success("Game pick saved!");
    } catch (error: any) {
      toast.error("Failed to save game pick", error.message);
    } finally {
      refreshRecentPick();
    }
  }, [currentPick, currentMood, createGamePick, refreshRecentPick]);

  return (
    <div className={`terminal-container w-full ${fullScreen ? 'h-screen' : 'h-[600px]'} flex flex-col p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Select Game</h3>
        {recentPick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRecentPick}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Recent
          </Button>
        )}
      </div>
      
      <div className="space-y-4 mb-4">
        <MoodFilterDropdown 
          currentMood={currentMood} 
          onMoodChange={setCurrentMood} 
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
              {currentMood ? `Try a different mood filter or add more games to your library` : 'Add some games to your library first'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center justify-center">
            {currentPick ? (
              <div className="w-full max-w-2xl">
                <SelectedGame 
                  game={currentPick} 
                  onNewSpin={handleNewSpin}
                  onAcceptPick={handleAcceptPick}
                  isPreviouslyPicked={isPreviouslyPicked}
                  isDemo={isDemo}
                />
                {isPreviouslyPicked && (
                  <div className="mt-4 flex justify-center">
                    <PreviouslyPickedBadge />
                  </div>
                )}
              </div>
            ) : isSpinning ? (
              <GameSpinner />
            ) : (
              <div className="text-center">
                <Button 
                  onClick={handleSpin}
                  className="btn-amber text-lg px-8 py-3"
                  disabled={isSpinning || isLoadingPick}
                >
                  {isLoadingPick ? 'Loading...' : 'Spin for a Game'}
                </Button>
                <p className="text-gray-400 mt-2 text-sm">
                  {availableGames.length} unplayed games available
                  {currentMood && ` (filtered by ${currentMood})`}
                </p>
              </div>
            )}
          </div>

          {recentPick && !currentPick && (
            <div className="mt-6">
              <RecentPick recentPick={recentPick} isDemo={isDemo} />
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

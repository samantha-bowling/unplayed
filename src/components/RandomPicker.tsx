
import { useState, useEffect } from 'react';
import { MousePointer } from 'lucide-react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import FullScreenModeToggle from './FullScreenModeToggle';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSessionPicker from '@/hooks/use-session-picker';
import GameSpinner from './GameSpinner';
import MoodFilterDropdown from './MoodFilterDropdown';
import SelectedGame from './SelectedGame';
import RecentPick from './RecentPick';
import { PickerNavigationState } from '@/utils/navigation';
import { withDemoIndicator, WithDemoProps } from '@/components/withDemoIndicator';
import { getRandomDestinyMessage } from '@/utils/destiny-messages';
import { useIsMobile } from '@/hooks/use-mobile';

// Array of quips to display during game selection
const selectionQuips = [
  "Compiling regret data...",
  "RNGsus take the wheel...",
  "Alt-tabbing through your indecision...",
  "Initializing regret engine...",
  "Spooling up ancient HDDs...",
  "Defragmenting expectations...",
  "Launching 3am decisions early...",
  "Deploying chaos.exe...",
  "Alt+F4 won't save you now...",
  "Pinging Valve for divine guidance...",
  "Brushing off the Steam cobwebs...",
  "Sorting by playtime... instantly regretting it...",
  "Overclocking your willpower...",
  "Minimizing responsibility...",
  "Threading the needle of your backlog...",
  "Installing patience.dll...",
  "Compiling excuses not to play that one...",
  "Checking RAM for nostalgia leaks...",
  "Shuffling bytes and broken promises...",
  "Querying the void (again)...",
  "Digging into the digital bargain bin...",
  "Mounting ancient ISO files...",
  "Filtering out that 300-hour RPG (you're welcome)...",
  "Evaluating decision trees... and lighting them on fire...",
  "Waiting for inspiration to load...",
  "Optimizing for guilt-based performance...",
  "Rebooting your impulse control...",
  "Running backlog_compliance_check.exe...",
  "Handshaking with your past self...",
  "Booting up the illusion of control..."
];

interface RandomPickerProps extends WithDemoProps {
  fullScreen?: boolean;
  initialFilters?: PickerNavigationState | null;
}

const RandomPicker = ({
  fullScreen = false,
  initialFilters = null,
  isDemo = false
}: RandomPickerProps) => {
  const {
    games,
    totalGames,
    isLoading,
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
    resetSessionState,
    user
  } = useSessionPicker();

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentQuip, setCurrentQuip] = useState<string>("Ready to select a game...");
  const [destinyMessage, setDestinyMessage] = useState<string>("Your Random Pick");
  
  const { isFullScreenMode } = useFullScreenMode();
  const isMobile = useIsMobile();

  // Determine if we should show in full screen mode
  const showFullScreenMode = fullScreen && isFullScreenMode;
  
  // Apply initial filters when component mounts or initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.mood) {
        setActiveMood(initialFilters.mood);
      } else if (initialFilters.genre) {
        const genreMood = initialFilters.genre.toLowerCase();
        setActiveMood(genreMood);
      }

      if (initialFilters.shouldAutoSpin) {
        const timer = setTimeout(() => {
          handleSpin();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [initialFilters]);

  const handleSpin = () => {
    if (isSpinning) return;
    
    // Select a random quip to display
    const randomQuipIndex = Math.floor(Math.random() * selectionQuips.length);
    setCurrentQuip(selectionQuips[randomQuipIndex]);
    
    // Select the game BEFORE the timeout to avoid stale closure
    const newSelectedGame = selectRandomGame();
    
    if (!newSelectedGame) {
      toast.error("No matching games found", {
        description: `Try a different mood or library filter.`,
      });
      return;
    }
    
    setIsSpinning(true);

    // Use timeout only for animation delay — game is already selected
    setTimeout(() => {
      setDestinyMessage(getRandomDestinyMessage());
      setIsSpinning(false);
    }, 2000);
  };
  
  const handleFilterSelect = (filterId: string) => {
    setActiveMood(filterId);
    resetSessionState();
  };
  
  const handlePlayGame = () => {
    if (!currentSessionPick) return;
    
    const steamUrl = `steam://run/${currentSessionPick.id}`;
    window.open(steamUrl, '_blank');
    // Toast is handled by SelectedGame — no duplicate here
  };

  const handleClearMood = () => {
    setActiveMood(null);
    resetSessionState();
  };

  const handleRollAgain = () => {
    handleSpin();
  };

  // Create recent pick data for display (session-only)
  const getRecentPickToShow = () => {
    if (!previousSessionPick || !hasPickedInSession) {
      return null;
    }

    return {
      id: 'session-previous',
      game_id: previousSessionPick.id,
      picked_at: new Date().toISOString(),
      filters: { mood: activeMood || undefined },
      game: {
        id: previousSessionPick.id,
        name: previousSessionPick.name,
        image_url: previousSessionPick.image,
        header_image: previousSessionPick.header_image,
        release_date: previousSessionPick.release_date || previousSessionPick.releaseDate,
        price_cents: previousSessionPick.price_cents || (previousSessionPick.price ? previousSessionPick.price * 100 : undefined),
        genres: previousSessionPick.genres || [],
        developer: previousSessionPick.developer || [],
        publisher: previousSessionPick.publisher || [],
        description: previousSessionPick.description
      },
      userGameData: {
        playtime_minutes: previousSessionPick.playtimeMinutes || 0,
        acquisition_date: null
      }
    };
  };
  
  return (
    <div className={`w-full ${fullScreen ? 'h-full' : ''}`}>
      {showFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      )}
      
      <div className="terminal-container">
        <div className="terminal-header mb-6">Random Game Picker</div>
        
        <div className="terminal-content">
          {/* Controls Section - Mobile responsive layout */}
          <div className={`mb-8 ${isMobile ? 'space-y-4' : 'flex justify-between items-center gap-4'}`}>
            <div className={`${isMobile ? 'space-y-3' : 'flex items-center gap-4'}`}>
              <div className={isMobile ? 'w-full' : ''}>
                <MoodFilterDropdown 
                  activeMood={activeMood}
                  onSelectMood={handleFilterSelect}
                  onClearMood={handleClearMood}
                />
              </div>
              
              <button 
                className={`btn-amber flex items-center ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''} ${isMobile ? 'w-full justify-center' : ''}`}
                onClick={handleSpin} 
                disabled={isSpinning}
              >
                <MousePointer className="mr-2 h-4 w-4" />
                {isSpinning ? 'Selecting...' : 'Select Game'}
              </button>
              
              {!showFullScreenMode && !currentSessionPick && (
                <div className={`flex items-center text-sm ${isMobile ? 'justify-center' : ''}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preventDuplicates}
                      onChange={() => setPreventDuplicates(!preventDuplicates)}
                      className="mr-1 h-4 w-4"
                      disabled={isSpinning}
                    />
                    <span className="text-gray-400">Prevent duplicates</span>
                  </label>
                </div>
              )}
            </div>
            
            {!showFullScreenMode && (
              <Tabs 
                defaultValue="unplayed" 
                value={scope}
                onValueChange={(value) => setScope(value as 'unplayed' | 'all')}
                className={isMobile ? 'w-full' : 'w-[260px]'}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unplayed">Unplayed Only</TabsTrigger>
                  <TabsTrigger value="all">Full Library</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          
          {/* Game display area */}
          <div className="mb-6" aria-live="polite">
            {isSpinning ? (
              <GameSpinner quip={currentQuip} />
            ) : currentSessionPick ? (
              <SelectedGame 
                game={currentSessionPick} 
                onPlayGame={handlePlayGame} 
                onRollAgain={handleRollAgain}
                disabled={isSpinning}
                headerMessage={destinyMessage}
                isDemo={isDemo}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <MousePointer className="h-12 w-12 text-gray-600 mb-4" />
                <p className="text-gray-400">
                  Click "Select Game" to find your next game
                </p>
              </div>
            )}
          </div>
          
          {/* Recent Pick section */}
          {getRecentPickToShow() && (
            <RecentPick recentPick={getRecentPickToShow()} isDemo={isDemo} />
          )}
        </div>
      </div>
    </div>
  );
};

export default withDemoIndicator(RandomPicker);


import { useState, useEffect } from 'react';
import { MousePointer } from 'lucide-react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import FullScreenModeToggle from './FullScreenModeToggle';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSessionPicker from '@/hooks/use-session-picker';
import GameSpinner from './GameSpinner';
import MoodFilterDropdown from './MoodFilterDropdown';
import SelectedGame from './SelectedGame';
import RecentPick from './RecentPick';
import { PickerNavigationState } from '@/utils/navigation';
import { withDemoIndicator, WithDemoProps } from '@/components/withDemoIndicator';
import { getRandomDestinyMessage } from '@/utils/destiny-messages';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentQuip, setCurrentQuip] = useState<string>("Ready to select a game...");
  const [destinyMessage, setDestinyMessage] = useState<string>("Your Random Pick");
  
  const { isFullScreenMode } = useFullScreenMode();

  // Determine if we should show in full screen mode
  const showFullScreenMode = fullScreen && isFullScreenMode;
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log('=== RandomPicker State Debug ===');
    console.log('Games available:', games?.length || 0);
    console.log('Current session pick:', currentSessionPick?.name || 'None');
    console.log('Previous session pick:', previousSessionPick?.name || 'None');
    console.log('Has picked in session:', hasPickedInSession);
    console.log('Demo mode:', isDemo);
    console.log('================================');
  }, [games, currentSessionPick, previousSessionPick, hasPickedInSession, isDemo]);
  
  // Apply initial filters when component mounts or initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      console.log('Applying initial filters:', initialFilters);
      
      // Apply genre or mood filter if provided
      if (initialFilters.mood) {
        setActiveMood(initialFilters.mood);
      } else if (initialFilters.genre) {
        // Find appropriate mood for the genre
        const genreMood = initialFilters.genre.toLowerCase();
        setActiveMood(genreMood);
      }

      // Auto-spin if requested
      if (initialFilters.shouldAutoSpin) {
        // Small delay to ensure filters are applied
        const timer = setTimeout(() => {
          handleSpin();
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [initialFilters]);

  const handleSpin = () => {
    if (isSpinning) {
      console.log('Spin prevented - operation in progress');
      return;
    }
    
    console.log('=== Starting Spin Process ===');
    console.log('Current filters:', { scope, activeMood, preventDuplicates });
    console.log('Available games:', games?.length || 0);
    console.log('Demo mode:', isDemo);
    
    // Select a random quip to display
    const randomQuipIndex = Math.floor(Math.random() * selectionQuips.length);
    setCurrentQuip(selectionQuips[randomQuipIndex]);
    
    setIsSpinning(true);

    // Simulate picking random game
    setTimeout(() => {
      console.log('Executing selectRandomGame...');
      const newSelectedGame = selectRandomGame();
      
      if (!newSelectedGame) {
        console.log('No game was selected - showing error');
        setIsSpinning(false);
        toast({
          title: "No matching games found",
          description: `Try a different mood or library filter.`,
          variant: "destructive"
        });
        return;
      }
      
      // Generate a destiny message for the selected game
      setDestinyMessage(getRandomDestinyMessage());
      
      console.log('Successfully selected game:', newSelectedGame.name);
      console.log('=== Spin Process Complete ===');
      setIsSpinning(false);
    }, 2000);
  };
  
  const handleFilterSelect = (filterId: string) => {
    console.log('Filter selected:', filterId);
    setActiveMood(filterId);
    setIsDropdownOpen(false);
    // Reset session state when filters change
    resetSessionState();
  };
  
  const handlePlayGame = () => {
    if (!currentSessionPick) return;
    
    const steamUrl = `steam://run/${currentSessionPick.id}`;
    window.open(steamUrl, '_blank');
    
    toast({
      title: "Launching game",
      description: `Opening ${currentSessionPick.name} in Steam`,
    });
  };

  const handleClearMood = () => {
    console.log('Clearing mood filter');
    setActiveMood(null);
    setIsDropdownOpen(false);
    // Reset session state when filters change
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
      {/* Show the full screen mode toggle in the corner when in full screen mode */}
      {showFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      )}
      
      {/* Main content container with terminal styling */}
      <div className="terminal-container">
        <div className="terminal-header mb-6">Random Game Picker_</div>
        
        <div className="terminal-content">
          {/* Controls Section */}
          <div className="flex justify-between items-center gap-4 mb-8">
            {/* Left side: Mood, Select Game button, and Prevent Duplicates */}
            <div className="flex items-center gap-4">
              <MoodFilterDropdown 
                activeMood={activeMood}
                onSelectMood={handleFilterSelect}
                onClearMood={handleClearMood}
                isDropdownOpen={isDropdownOpen}
                toggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
              />
              
              <button 
                className={`btn-amber flex items-center ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSpin} 
                disabled={isSpinning}
              >
                <MousePointer className="mr-2 h-4 w-4" />
                {isSpinning ? 'Selecting...' : 'Select Game.exe'}
              </button>
              
              {!showFullScreenMode && !currentSessionPick && (
                <div className="flex items-center text-sm">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preventDuplicates}
                      onChange={() => {
                        console.log('Prevent duplicates toggled:', !preventDuplicates);
                        setPreventDuplicates(!preventDuplicates);
                      }}
                      className="mr-1 h-4 w-4"
                      disabled={isSpinning}
                    />
                    <span className="text-gray-400">Prevent duplicates</span>
                  </label>
                </div>
              )}
            </div>
            
            {/* Right side: Unplayed Only / Full Library tabs */}
            {!showFullScreenMode && (
              <Tabs 
                defaultValue="unplayed" 
                value={scope}
                onValueChange={(value) => setScope(value as 'unplayed' | 'all')}
                className="w-[260px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unplayed">Unplayed Only</TabsTrigger>
                  <TabsTrigger value="all">Full Library</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          
          {/* Game display area - shows current session pick */}
          <div className="mb-6">
            {isSpinning ? (
              <GameSpinner quip={currentQuip} />
            ) : currentSessionPick ? (
              <SelectedGame 
                game={currentSessionPick} 
                onPlayGame={handlePlayGame} 
                onRollAgain={handleRollAgain}
                disabled={isSpinning}
                headerMessage={destinyMessage}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <MousePointer className="h-12 w-12 text-gray-600 mb-4" />
                <p className="text-gray-400">
                  Click "Select Game.exe" to find your next game
                </p>
              </div>
            )}
          </div>
          
          {/* Recent Pick section - shows previous session pick */}
          {getRecentPickToShow() && (
            <RecentPick recentPick={getRecentPickToShow()} />
          )}
        </div>
      </div>
    </div>
  );
};

// Export the component wrapped with the withDemoIndicator HOC
export default withDemoIndicator(RandomPicker);

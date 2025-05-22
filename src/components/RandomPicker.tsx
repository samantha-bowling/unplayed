import { useState, useEffect } from 'react';
import { MousePointer, ExternalLink } from 'lucide-react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import FullScreenModeToggle from './FullScreenModeToggle';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { GameListItem } from '@/types/unplayed-data.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePickerData from '@/hooks/use-picker-data';
import GameSpinner from './GameSpinner';
import MoodFilterDropdown from './MoodFilterDropdown';
import SelectedGame from './SelectedGame';
import RecentlySelected from './RecentlySelected';
import { PickerNavigationState } from '@/utils/navigation';
import { withDemoIndicator, WithDemoProps } from '@/components/withDemoIndicator';

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
  "Updating your will-to-launch drivers...",
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
    recentPicks,
  } = usePickerData();

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [spinHistory, setSpinHistory] = useState<Array<GameListItem>>([]);
  const [currentQuip, setCurrentQuip] = useState<string>("Ready to select a game...");
  
  const {
    isFullScreenMode
  } = useFullScreenMode();

  // Determine if we should show in full screen mode
  const showFullScreenMode = fullScreen && isFullScreenMode;
  
  // Apply initial filters when component mounts or initialFilters changes
  useEffect(() => {
    if (initialFilters) {
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
    if (isSpinning) return;
    
    // Select a random quip to display
    const randomQuipIndex = Math.floor(Math.random() * selectionQuips.length);
    setCurrentQuip(selectionQuips[randomQuipIndex]);
    
    setIsSpinning(true);
    setSelectedGame(null);

    // Simulate picking random game
    setTimeout(() => {
      const newSelectedGame = selectRandomGame();
      
      if (!newSelectedGame) {
        setIsSpinning(false);
        toast({
          title: "No matching games found",
          description: `Try a different mood or library filter.`,
          variant: "destructive"
        });
        return;
      }
      
      setSelectedGame(newSelectedGame);
      
      // Save to local history
      setSpinHistory(prev => [newSelectedGame, ...prev].slice(0, 5));
      
      setIsSpinning(false);
    }, 2000);
  };
  
  const handleFilterSelect = (filterId: string) => {
    setActiveMood(filterId);
    setIsDropdownOpen(false);
  };
  
  const handlePlayGame = () => {
    if (!selectedGame) return;
    
    const steamUrl = `steam://run/${selectedGame.id}`;
    window.open(steamUrl, '_blank');
    
    toast({
      title: "Launching game",
      description: `Opening ${selectedGame.title} in Steam`,
    });
  };

  const handleClearMood = () => {
    setActiveMood(null);
    setIsDropdownOpen(false);
  };
  
  return (
    <div className={`terminal-container w-full ${fullScreen ? 'h-full' : ''}`}>
      {/* Show the full screen mode toggle in the corner when in full screen mode */}
      {showFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="terminal-header text-2xl mb-4">Random Game Picker</h3>
        
        {!showFullScreenMode && (
          <div className="flex items-center gap-2">
            <Tabs 
              defaultValue="unplayed" 
              value={scope}
              onValueChange={(value) => setScope(value as 'unplayed' | 'all')}
              className="w-[260px]"
            >
              <TabsList>
                <TabsTrigger value="unplayed">Unplayed Only</TabsTrigger>
                <TabsTrigger value="all">Full Library</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <MoodFilterDropdown 
          activeMood={activeMood}
          onSelectMood={handleFilterSelect}
          onClearMood={handleClearMood}
          isDropdownOpen={isDropdownOpen}
          toggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
        />
        
        <button 
          className="btn-amber flex items-center" 
          onClick={handleSpin} 
          disabled={isSpinning}
        >
          <MousePointer className="mr-2 h-4 w-4" />
          {isSpinning ? 'Selecting...' : 'Select Game.exe'}
        </button>
        
        {!showFullScreenMode && !selectedGame && (
          <div className="flex items-center ml-2 text-sm">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preventDuplicates}
                onChange={() => setPreventDuplicates(!preventDuplicates)}
                className="mr-1 h-4 w-4"
              />
              <span className="text-gray-400">Prevent duplicates</span>
            </label>
          </div>
        )}
      </div>
      
      {/* Game display area */}
      <div className="mb-6">
        {isSpinning ? (
          <GameSpinner quip={currentQuip} />
        ) : selectedGame ? (
          <SelectedGame 
            game={selectedGame} 
            onPlayGame={handlePlayGame} 
            onRollAgain={handleSpin} 
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <MousePointer className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">Click "Select Game.exe" to find your next game</p>
          </div>
        )}
      </div>
      
      {/* History section */}
      <RecentlySelected recentPicks={recentPicks} spinHistory={spinHistory} />
    </div>
  );
};

// Export the component wrapped with the withDemoIndicator HOC
export default withDemoIndicator(RandomPicker);

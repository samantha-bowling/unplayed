
import { useState, useEffect } from 'react';
import { ChevronDown, X, Clock, MousePointer, ExternalLink } from 'lucide-react';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import FullScreenModeToggle from './FullScreenModeToggle';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { GameListItem } from '@/types/unplayed-data.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePickerData from '@/hooks/use-picker-data';
import GamePickCard from './GamePickCard';

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

// Categories for the mood-based filtering
const moodCategories = [{
  id: 'cozy',
  name: 'Cozy',
  icon: '🏠'
}, {
  id: 'adventure',
  name: 'Adventure',
  icon: '🧭'
}, {
  id: 'challenge',
  name: 'Challenge',
  icon: '💪'
}, {
  id: 'story',
  name: 'Story-rich',
  icon: '📖'
}, {
  id: 'quick',
  name: 'Quick Play',
  icon: '⚡'
}];

interface RandomPickerProps {
  fullScreen?: boolean;
}

const RandomPicker = ({
  fullScreen = false
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
  
  return <div className={`terminal-container w-full ${fullScreen ? 'h-full' : ''}`}>
      {/* Show the full screen mode toggle in the corner when in full screen mode */}
      {showFullScreenMode && <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="terminal-header text-2xl mb-4">Random Game Picker</h3>
        
        {!showFullScreenMode && <div className="flex items-center gap-2">
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
        </div>}
      </div>
      
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="btn-primary flex items-center"
          >
            {activeMood ? moodCategories.find(cat => cat.id === activeMood)?.name : 'Mood'} 
            <ChevronDown className="ml-2 h-4 w-4" />
          </button>
          
          {isDropdownOpen && <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-black border border-unplayed-mint/30 z-10">
              <div className="py-1">
                {moodCategories.map(category => <button key={category.id} onClick={() => handleFilterSelect(category.id)} className="block w-full text-left px-4 py-2 text-sm hover:bg-unplayed-mint/10">
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>)}
                {activeMood && <button onClick={() => {
              setActiveMood(null);
              setIsDropdownOpen(false);
            }} className="block w-full text-left px-4 py-2 text-sm text-unplayed-red hover:bg-unplayed-red/10">
                    <X className="inline mr-2 h-4 w-4" />
                    Clear filter
                  </button>}
              </div>
            </div>}
        </div>
        
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
        {isSpinning ? <div className="h-80 flex items-center justify-center">
            <div className="text-4xl text-unplayed-amber animate-spin">⚙️</div>
            <p className="ml-4 text-lg text-gray-300 animate-pulse">{currentQuip}</p>
          </div> : selectedGame ? <div className="pixel-card animate-fade-in">
            <img src={selectedGame.imageUrl || ''} alt={selectedGame.title} className="w-full h-48 object-cover rounded-md mb-4" />
            
            <h3 className="text-xl font-bold text-white mb-2">{selectedGame.title}</h3>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                <span>Never played</span>
              </div>
            </div>
            
            <div className="flex justify-between space-x-2">
              <Button 
                className="btn-primary flex-grow"
                onClick={handlePlayGame}
                disabled={!selectedGame.id}
              >
                Play Now
              </Button>
              <Button 
                className="btn-secondary flex-grow" 
                onClick={handleSpin}
              >
                Roll Again
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-unplayed-amber font-medium">
                Fate has spoken: Play <span className="text-unplayed-pink">{selectedGame.title}</span>
              </p>
            </div>
          </div> : <div className="h-64 flex flex-col items-center justify-center text-center">
            <MousePointer className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">Click "Select Game.exe" to find your next game</p>
          </div>}
      </div>
      
      {/* History section */}
      {((spinHistory.length > 0) || (recentPicks && recentPicks.length > 0)) && <div>
          <h4 className="text-lg font-medium text-gray-300 mb-3">Recently Selected</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {recentPicks && recentPicks.length > 0 ? (
              recentPicks.slice(0, 5).map((pick, index) => (
                <GamePickCard 
                  key={pick.id} 
                  game={pick.game || { id: pick.game_id, title: `Game #${pick.game_id}` } as GameListItem} 
                  pick={pick}
                  compact={true}
                />
              ))
            ) : spinHistory.map((game, index) => (
              <div key={`history-${index}`} className="bg-black/30 rounded p-2 text-sm flex items-center">
                <img src={game.imageUrl || ''} alt={game.title} className="w-8 h-8 object-cover rounded mr-2" />
                <span className="text-gray-300 truncate">{game.title}</span>
              </div>
            ))}
          </div>
        </div>}
    </div>;
};

export default RandomPicker;

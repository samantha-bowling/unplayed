import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export const AudioPlayerControls = () => {
  const { status, togglePlayPause, skipPrevious, skipNext, rewind } = useAudioPlayer();
  
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={skipPrevious}
        disabled={isLoading}
        aria-label="Skip to previous track"
        className="h-7 w-7 text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        <SkipBack size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={rewind}
        disabled={isLoading}
        aria-label="Rewind 10 seconds"
        className="h-7 w-7 text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        <RotateCcw size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="h-8 w-8 text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={skipNext}
        disabled={isLoading}
        aria-label="Skip to next track"
        className="h-7 w-7 text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        <SkipForward size={14} />
      </Button>
    </div>
  );
};

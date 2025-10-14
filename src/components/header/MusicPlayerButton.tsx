import { useState } from 'react';
import { Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

const MusicPlayerButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTrack, status } = useAudioPlayer();
  
  const isPlaying = status === 'playing';
  const tooltipText = isPlaying ? `${currentTrack.title} - ${currentTrack.artist}` : 'Music Player';

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 p-0 flex items-center justify-center bg-black/50 border-gray-700 hover:bg-black/70"
              onClick={() => setIsOpen(true)}
              aria-label="Open music player"
            >
              <Music2 size={18} className={isPlaying ? 'text-unplayed-mint' : ''} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="terminal-container max-w-md sm:max-w-lg w-[calc(100vw-2rem)]">
          <DialogTitle className="text-unplayed-mint font-space">Now Playing</DialogTitle>
          <AudioPlayer />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MusicPlayerButton;

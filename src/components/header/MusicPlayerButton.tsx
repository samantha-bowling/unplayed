import { useState } from 'react';
import { Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AudioPlayerCompact } from '@/components/audio/AudioPlayerCompact';

const MusicPlayerButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTrack, status, togglePlayPause } = useAudioPlayer();
  
  const isPlaying = status === 'playing';
  const tooltipText = isPlaying 
    ? (isOpen ? 'Hide Player' : `${currentTrack.title} - ${currentTrack.artist}`)
    : 'Play Music';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 p-0 flex items-center justify-center bg-black/50 border-gray-700 hover:bg-black/70 relative"
                onClick={handleClick}
                aria-label={tooltipText}
              >
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ 
                    repeat: isPlaying ? Infinity : 0, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <Music2 size={18} className={isPlaying ? 'text-unplayed-mint' : 'text-gray-400'} />
                </motion.div>
                {isPlaying && !isOpen && (
                  <motion.div
                    className="absolute top-1 right-1 w-2 h-2 bg-unplayed-mint rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="w-[380px] p-0 bg-black/95 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] backdrop-blur-sm transition-all duration-300"
        >
          <div className="border-b border-unplayed-mint/20 bg-black/50 p-3 overflow-hidden relative">
            <div className="flex animate-marquee-slow">
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8">
                🎵 Now Playing
              </h3>
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8" aria-hidden="true">
                🎵 Now Playing
              </h3>
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8" aria-hidden="true">
                🎵 Now Playing
              </h3>
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8" aria-hidden="true">
                🎵 Now Playing
              </h3>
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8" aria-hidden="true">
                🎵 Now Playing
              </h3>
              <h3 className="text-unplayed-mint font-space text-sm flex items-center gap-2 whitespace-nowrap pr-8" aria-hidden="true">
                🎵 Now Playing
              </h3>
            </div>
          </div>
          <div className="p-4">
            <AudioPlayerCompact />
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default MusicPlayerButton;

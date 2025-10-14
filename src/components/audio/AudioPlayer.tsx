import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AudioVolumeControl } from './AudioVolumeControl';
import { AudioVisualizer } from './AudioVisualizer';
import { Button } from '@/components/ui/button';

export const AudioPlayer = () => {
  const { isExpanded, toggleExpanded, currentTrack, status, errorMessage } = useAudioPlayer();

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 'auto' : '70px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full bg-black/60 backdrop-blur-md border-t border-white/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Collapsed State */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={useAudioPlayer().togglePlayPause}
              disabled={status === 'loading' || !currentTrack.src}
              aria-label={status === 'playing' ? 'Pause' : 'Play'}
              className="h-9 w-9 text-gray-400 hover:text-unplayed-mint transition-colors"
            >
              {status === 'playing' ? (
                <span className="text-lg">⏸</span>
              ) : (
                <span className="text-lg">▶</span>
              )}
            </Button>
            
            <div className="flex flex-col">
              <span className="font-space text-sm font-medium text-white">
                {currentTrack.title}
              </span>
              <span className="font-space text-xs text-gray-400">
                {currentTrack.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isExpanded && <AudioVolumeControl compact />}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
              className="h-8 w-8 text-gray-400 hover:text-unplayed-mint transition-colors"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </Button>
          </div>
        </div>

        {/* Expanded State */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pb-4 space-y-3"
            >
              <AudioProgressBar />
              
              <div className="flex items-center justify-between">
                <AudioPlayerControls />
                
                <div className="flex items-center gap-4">
                  <AudioVolumeControl />
                  <AudioVisualizer />
                </div>
              </div>

              {status === 'error' && errorMessage && (
                <div className="text-xs text-unplayed-red">
                  {errorMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

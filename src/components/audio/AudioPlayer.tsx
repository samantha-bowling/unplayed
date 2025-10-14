import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AudioVolumeControl } from './AudioVolumeControl';
import { AudioVisualizer } from './AudioVisualizer';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const AudioPlayer = () => {
  const { 
    currentTrack, 
    status, 
    errorMessage, 
    isExpanded, 
    toggleExpanded,
    togglePlayPause 
  } = useAudioPlayer();
  
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  return (
    <div className="w-full">
      <motion.div 
        className="relative overflow-hidden"
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '48px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* COLLAPSED STATE */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between gap-3 px-4 py-3 h-[48px]"
            >
              {/* Play/Pause button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="h-8 w-8 text-gray-400 hover:text-unplayed-mint transition-colors flex-shrink-0"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <span className="font-space text-sm font-medium text-white truncate block">
                  {currentTrack.title} <span className="text-gray-500">-</span> <span className="text-gray-400">{currentTrack.artist}</span>
                </span>
              </div>

              {/* Expand button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                aria-label="Expand player"
                aria-expanded={false}
                className="h-8 w-8 text-gray-400 hover:text-unplayed-mint transition-colors flex-shrink-0"
              >
                <ChevronDown size={18} />
              </Button>
            </motion.div>
          ) : (
            /* EXPANDED STATE */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {/* Collapse button - top right */}
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpanded}
                  aria-label="Collapse player"
                  aria-expanded={true}
                  className="h-7 w-7 text-gray-400 hover:text-unplayed-mint transition-colors"
                >
                  <ChevronUp size={16} />
                </Button>
              </div>

              {/* Visualizer at top - full width */}
              <div className="mb-3">
                <AudioVisualizer />
              </div>

              {/* Progress bar with timestamps */}
              <div className="mb-3">
                <AudioProgressBar />
              </div>

              {/* Bottom row: Metadata and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left: Track metadata */}
                <div className="flex flex-col min-w-0 flex-shrink">
                  <span className="font-space text-sm font-medium text-white truncate">
                    {currentTrack.title}
                  </span>
                  <span className="font-space text-xs text-gray-400 truncate">
                    {currentTrack.artist}
                  </span>
                </div>

                {/* Right: All controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AudioPlayerControls />
                  <div className="ml-1">
                    <AudioVolumeControl compact />
                  </div>
                </div>
              </div>

              {/* Error message if any */}
              {status === 'error' && errorMessage && (
                <div className="mt-2 text-xs text-unplayed-red">
                  {errorMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

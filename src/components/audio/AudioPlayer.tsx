import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AudioVolumeControl } from './AudioVolumeControl';
import { AudioVisualizer } from './AudioVisualizer';

export const AudioPlayer = () => {
  const { currentTrack, status, errorMessage } = useAudioPlayer();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8">
      <div className="terminal-container p-4">
        {/* Visualizer at top - full width */}
        <div className="mb-3">
          <AudioVisualizer />
        </div>

        {/* Progress bar with timestamps */}
        <div className="mb-3">
          <AudioProgressBar />
        </div>

        {/* Bottom row: Metadata left, Controls right */}
        <div className="flex items-center justify-between gap-4">
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
      </div>
    </div>
  );
};

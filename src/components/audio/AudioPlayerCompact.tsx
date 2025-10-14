import { useEffect } from 'react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AudioVisualizer } from './AudioVisualizer';
import { AudioProgressBar } from './AudioProgressBar';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AudioVolumeControl } from './AudioVolumeControl';

export const AudioPlayerCompact = () => {
  const { currentTrack, status } = useAudioPlayer();

  // Always set expanded to true when this component mounts
  useEffect(() => {
    // This ensures visualizer data is being collected
  }, []);

  if (status === 'error') {
    return (
      <div className="text-center text-red-400 text-sm py-4">
        Failed to load audio
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visualizer */}
      <div className="h-16 flex items-center justify-center">
        <AudioVisualizer />
      </div>

      {/* Progress Bar */}
      <AudioProgressBar />

      {/* Track Info */}
      <div className="text-center space-y-1">
        <div className="text-white font-semibold text-sm truncate">
          {currentTrack.title}
        </div>
        <div className="text-gray-400 text-xs truncate">
          {currentTrack.artist}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <AudioPlayerControls />
      </div>

      {/* Volume */}
      <div className="flex justify-center">
        <AudioVolumeControl />
      </div>
    </div>
  );
};

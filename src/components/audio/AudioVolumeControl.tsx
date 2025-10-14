import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface AudioVolumeControlProps {
  compact?: boolean;
}

export const AudioVolumeControl = ({ compact = false }: AudioVolumeControlProps) => {
  const { volume, setVolume, isMuted, toggleMute } = useAudioPlayer();
  
  const VolumeIcon = isMuted || volume === 0 
    ? VolumeX 
    : volume < 0.5 
    ? Volume1 
    : Volume2;

  if (compact) {
    return (
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        <VolumeIcon size={16} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 w-28">
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className="text-gray-400 hover:text-unplayed-mint transition-colors"
      >
        <VolumeIcon size={16} />
      </button>
      <Slider
        value={[isMuted ? 0 : volume * 100]}
        onValueChange={([v]) => setVolume(v / 100)}
        max={100}
        step={1}
        className="w-full"
        aria-label="Volume"
      />
    </div>
  );
};

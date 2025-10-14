import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Progress } from '@/components/ui/progress';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioProgressBar = () => {
  const { currentTime, duration, seek } = useAudioPlayer();
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="flex-1 cursor-pointer"
        onClick={handleClick}
        role="progressbar"
        aria-label="Audio progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Progress value={progress} className="h-1.5" />
      </div>
      <div className="flex items-center gap-1 text-xs font-mono text-gray-500 min-w-[80px] justify-end">
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

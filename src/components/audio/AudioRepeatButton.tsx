import { Repeat, Repeat1 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const AudioRepeatButton = () => {
  const { repeatMode, toggleRepeat, status } = useAudioPlayer();
  const isLoading = status === 'loading';

  const getIcon = () => {
    if (repeatMode === 'one') {
      return <Repeat1 size={14} />;
    }
    return <Repeat size={14} />;
  };

  const getLabel = () => {
    switch (repeatMode) {
      case 'off':
        return 'Repeat: Off';
      case 'one':
        return 'Repeat: One';
      case 'all':
        return 'Repeat: All';
    }
  };

  const getColor = () => {
    return repeatMode !== 'off' ? 'text-unplayed-mint' : 'text-gray-400';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            disabled={isLoading}
            aria-label={getLabel()}
            className={`h-7 w-7 ${getColor()} hover:text-unplayed-mint transition-colors relative`}
          >
            {getIcon()}
            {repeatMode !== 'off' && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                {repeatMode === 'one' ? (
                  <span className="text-[8px] font-bold text-unplayed-mint bg-black/80 rounded-full w-3 h-3 flex items-center justify-center border border-unplayed-mint/30">
                    1
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-unplayed-mint"></span>
                )}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

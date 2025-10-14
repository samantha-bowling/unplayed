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
            className={`h-7 w-7 ${getColor()} hover:text-unplayed-mint transition-colors`}
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

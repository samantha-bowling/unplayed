
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

interface PlayNowButtonProps {
  gameId: number;
  gameName: string;
  className?: string;
}

const PlayNowButton: React.FC<PlayNowButtonProps> = ({ gameId, gameName, className }) => {
  const handlePlayGame = () => {
    try {
      const steamUrl = `steam://run/${gameId}`;
      window.open(steamUrl, '_self');
      
      toast.success(`Launching ${gameName}`, {
        description: "Opening Steam to launch the game..."
      });
    } catch (error) {
      console.error('Error launching game:', error);
      toast.error("Failed to launch game", {
        description: "Make sure Steam is installed and running."
      });
    }
  };

  return (
    <Button
      onClick={handlePlayGame}
      size="sm"
      className={`bg-unplayed-mint text-black hover:bg-unplayed-mint/90 font-medium ${className}`}
    >
      <Play className="h-3 w-3 mr-1" />
      Play Now
    </Button>
  );
};

export default PlayNowButton;

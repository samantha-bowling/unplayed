
import React, { useState } from 'react';
import { Clock, Eye, EyeOff, FileEdit, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getBestGameImage, formatGameTitle } from '@/utils/image-utils';

interface GameCardProps {
  id: string;
  gameId: number;
  title: string;
  imageUrl: string | null;
  dustScore: number | null;
  playtimeMinutes: number | null;
  isHidden: boolean | null;
  notes: string | null;
  onMarkAsPlayed: () => void;
  onToggleHidden: () => void;
  onSaveNote: (note: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({
  id,
  gameId,
  title,
  imageUrl,
  dustScore,
  playtimeMinutes,
  isHidden,
  notes,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [noteText, setNoteText] = useState(notes || '');
  
  // Format playtime for display
  const formatPlaytime = (minutes: number | null): string => {
    if (!minutes || minutes === 0) return "Unplayed";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg border transition-all duration-300",
        isHidden ? "opacity-60" : "",
        isHovered ? "scale-[1.03] shadow-lg z-10" : "" // Reduced scale for more subtle effect
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video w-full relative">
        <img 
          src={getBestGameImage(null, imageUrl, gameId)}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Dust score */}
        {dustScore !== null && (
          <span className="absolute top-2 right-2 bg-black/70 text-unplayed-mint px-2 py-1 rounded text-xs font-medium">
            {dustScore} Dust
          </span>
        )}
        
        {/* Hidden indicator */}
        {isHidden && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <EyeOff className="text-white/70 h-8 w-8" />
          </div>
        )}
      </div>
      
      <div className="p-3 bg-black/80">
        <h3 className="font-medium text-sm truncate" title={title}>{formatGameTitle(title)}</h3>
        
        <div className="flex items-center text-xs text-gray-400 mt-1">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatPlaytime(playtimeMinutes)}</span>
        </div>
      </div>
      
      {/* Actions overlay - visible on hover */}
      <div className={cn(
        "absolute inset-0 bg-black/85 flex flex-col p-4 transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <h3 className="font-medium mb-2">{title}</h3>
        
        <div className="flex-grow flex flex-col gap-3 justify-center">
          <Button 
            onClick={onMarkAsPlayed} 
            variant="outline"
            className="bg-unplayed-mint/20 border-unplayed-mint/50 hover:bg-unplayed-mint/30"
          >
            <Check className="mr-2 h-4 w-4" /> 
            Mark as Played
          </Button>
          
          <Button 
            onClick={onToggleHidden} 
            variant="outline"
            className="border-gray-600 hover:bg-gray-800"
          >
            {isHidden ? (
              <>
                <Eye className="mr-2 h-4 w-4" /> Show Game
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Ignore Game
              </>
            )}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-gray-600 hover:bg-gray-800"
              >
                <FileEdit className="mr-2 h-4 w-4" /> 
                {notes ? "Edit Note" : "Add Note"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Game Notes: {title}</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <Textarea
                  placeholder="Add your thoughts about this game..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                />
              </div>
              
              <DialogFooter className="flex sm:justify-between">
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    onClick={() => onSaveNote(noteText)}
                    className="bg-unplayed-mint hover:bg-unplayed-mint/90 text-black"
                  >
                    Save Note
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Show notes preview if they exist */}
        {notes && (
          <div className="mt-2 bg-gray-900/50 p-2 rounded text-xs border border-gray-700 line-clamp-2">
            <p className="text-gray-300">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(GameCard);

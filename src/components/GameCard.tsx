
import React, { useState } from 'react';
import { Clock, Eye, EyeOff, FileEdit, Play, ExternalLink } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getBestGameImage, formatGameTitle } from '@/utils/image-utils';
import LazyImage from '@/components/ui/lazy-image';

interface GameCardProps {
  id: string;
  gameId: number;
  title: string;
  imageUrl: string | null;
  headerImage?: string | null;
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
  headerImage,
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

  // Generate Steam store URL
  const getSteamUrl = (gameId: number): string => {
    return `https://store.steampowered.com/app/${gameId}/`;
  };

  const handleSteamVisit = () => {
    window.open(getSteamUrl(gameId), '_blank', 'noopener,noreferrer');
  };

  // Launch game directly using steam:// protocol
  const handlePlayNow = () => {
    const steamUrl = `steam://rungameid/${gameId}`;
    window.open(steamUrl, '_blank');
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg border transition-all duration-300",
        isHidden ? "opacity-60" : "",
        isHovered ? "scale-[1.03] shadow-lg z-10" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video w-full relative">
        <LazyImage
          src={getBestGameImage(headerImage, imageUrl, gameId)}
          alt={`${title} game cover`}
          className="w-full h-full"
          fallbackSrc="/placeholder.svg"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          format="auto"
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
        <div className="flex-grow flex flex-col justify-center">
          {/* 2x2 Grid Layout */}
          <TooltipProvider>
            <div className="grid grid-cols-2 gap-3">
              {/* Top Left: Play Now */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handlePlayNow} 
                    variant="outline"
                    size="sm"
                    className="bg-unplayed-mint/20 border-unplayed-mint/50 hover:bg-unplayed-mint/30 p-2 h-12"
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Play Now</p>
                </TooltipContent>
              </Tooltip>

              {/* Top Right: Visit on Steam */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSteamVisit}
                    variant="outline"
                    size="sm"
                    className="border-blue-500/50 hover:bg-blue-500/20 p-2 h-12"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visit on Steam</p>
                </TooltipContent>
              </Tooltip>

              {/* Bottom Left: Show/Hide Game */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onToggleHidden} 
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:bg-gray-800 p-2 h-12"
                  >
                    {isHidden ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isHidden ? "Show Game" : "Ignore Game"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Bottom Right: Add/Edit Note */}
              <Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-gray-600 hover:bg-gray-800 p-2 h-12"
                      >
                        <FileEdit className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{notes ? "Edit Note" : "Add Note"}</p>
                  </TooltipContent>
                </Tooltip>
                
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
          </TooltipProvider>
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

export default React.memo(GameCard);

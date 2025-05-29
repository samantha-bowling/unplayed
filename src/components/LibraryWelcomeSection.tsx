
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Archive, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LibraryWelcomeSectionProps {
  unplayedCount: number;
  totalGames: number;
}

const LibraryWelcomeSection: React.FC<LibraryWelcomeSectionProps> = ({
  unplayedCount,
  totalGames
}) => {
  const getMotivationalMessage = () => {
    if (unplayedCount === 0) return "Impressive! You've played all your games. Time to add more?";
    if (unplayedCount <= 5) return "You're so close to tackling your entire backlog. Keep it up!";
    if (unplayedCount <= 20) return "Your backlog is manageable. Pick something from the Shelf Life section!";
    if (unplayedCount <= 50) return "You've got quite the collection. Try the Random Picker to decide what's next!";
    return "That's an epic backlog! Let's organize and conquer it one game at a time.";
  };

  return (
    <div className="bg-black/30 border border-unplayed-mint/20 rounded-lg p-4 mb-6 transform transition-all duration-300 hover:border-unplayed-mint/40">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-grow">
          <h2 className="text-xl font-medium mb-1 flex items-center">
            <span>Welcome back, Commander of the Backlog</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-2 text-unplayed-mint/60 hover:text-unplayed-mint transition-colors">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Your game library at a glance. Use the tools below to explore and organize your collection.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          <p className="text-gray-400">
            {getMotivationalMessage()}
          </p>
        </div>
        
        <div className="w-full md:w-auto">
          <Link to="/spend">
            <Button variant="outline" className="w-full md:w-auto">
              <Archive className="mr-2 h-4 w-4" />
              View Most Expensive Unplayed
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LibraryWelcomeSection;

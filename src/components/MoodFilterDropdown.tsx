
import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Categories for the mood-based filtering
export const moodCategories = [{
  id: 'cozy',
  name: 'Cozy',
  icon: '🏠'
}, {
  id: 'adventure',
  name: 'Adventure',
  icon: '🧭'
}, {
  id: 'challenge',
  name: 'Challenge',
  icon: '💪'
}, {
  id: 'story',
  name: 'Story-rich',
  icon: '📖'
}, {
  id: 'quick',
  name: 'Quick Play',
  icon: '⚡'
}];

interface MoodFilterDropdownProps {
  activeMood: string | null;
  onSelectMood: (moodId: string) => void;
  onClearMood: () => void;
}

const MoodFilterDropdown: React.FC<MoodFilterDropdownProps> = ({
  activeMood,
  onSelectMood,
  onClearMood,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn-primary flex items-center">
          {activeMood ? moodCategories.find(cat => cat.id === activeMood)?.name : 'Mood'} 
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-48 bg-black border border-unplayed-mint/30">
        {moodCategories.map(category => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onSelectMood(category.id)}
            className="cursor-pointer"
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </DropdownMenuItem>
        ))}
        
        {activeMood && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearMood}
              className="text-red-400 focus:text-red-400 cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MoodFilterDropdown;

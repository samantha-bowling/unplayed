
import React from 'react';
import { ChevronDown, X } from 'lucide-react';

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
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
}

const MoodFilterDropdown: React.FC<MoodFilterDropdownProps> = ({
  activeMood,
  onSelectMood,
  onClearMood,
  isDropdownOpen,
  toggleDropdown
}) => {
  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown} 
        className="btn-primary flex items-center"
      >
        {activeMood ? moodCategories.find(cat => cat.id === activeMood)?.name : 'Mood'} 
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-black border border-unplayed-mint/30 z-10">
          <div className="py-1">
            {moodCategories.map(category => (
              <button 
                key={category.id} 
                onClick={() => onSelectMood(category.id)} 
                className="block w-full text-left px-4 py-2 text-sm hover:bg-unplayed-mint/10"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
            
            {activeMood && (
              <button 
                onClick={onClearMood} 
                className="block w-full text-left px-4 py-2 text-sm text-unplayed-red hover:bg-unplayed-red/10"
              >
                <X className="inline mr-2 h-4 w-4" />
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodFilterDropdown;


import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SortOption } from '@/hooks/use-library-data';

interface LibraryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hideIgnored: boolean;
  onHideIgnoredChange: () => void;
  onlyUnplayed: boolean;
  onOnlyUnplayedChange: () => void;
  sortBy: SortOption;
  sortDirection: 'asc' | 'desc';
  onSortChange: (option: SortOption) => void;
  onResetFilters: () => void;
}

const SortOptions: { label: string; value: SortOption }[] = [
  { label: 'Game Name', value: 'name' },
  { label: 'Dust Score', value: 'dust_score' },
  { label: 'Date Acquired', value: 'acquisition_date' },
  { label: 'Playtime', value: 'playtime_minutes' },
  { label: 'Last Played', value: 'last_played_date' },
];

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  hideIgnored,
  onHideIgnoredChange,
  onlyUnplayed,
  onOnlyUnplayedChange,
  sortBy,
  sortDirection,
  onSortChange,
  onResetFilters
}) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Get the label for the current sort option
  const currentSortLabel = SortOptions.find(option => option.value === sortBy)?.label || 'Sort By';

  return (
    <div className="w-full space-y-4 mb-6">
      {/* Search and main filters bar */}
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-grow">
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus-visible:border-unplayed-mint"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-32 justify-between">
              <span>{currentSortLabel}</span> 
              <span className="ml-2 opacity-70">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              {SortOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => onSortChange(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {option.value === sortBy && (
                    <Check className="h-4 w-4 text-unplayed-mint" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters toggle */}
        <Button 
          variant="outline"
          onClick={() => setFiltersVisible(!filtersVisible)}
          className={filtersVisible ? 'bg-unplayed-mint/20 border-unplayed-mint' : ''}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" /> 
          Filters
        </Button>

        {/* Reset filters button - only show if filters are applied */}
        {(searchQuery || hideIgnored || onlyUnplayed) && (
          <Button 
            variant="ghost" 
            onClick={onResetFilters}
            className="text-unplayed-red hover:text-unplayed-red/70"
          >
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Expanded filters section */}
      {filtersVisible && (
        <div className="p-4 border rounded-lg bg-background/50 animate-in fade-in">
          <h3 className="text-sm font-medium mb-3">Filter Options</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={hideIgnored ? "default" : "outline"}
              size="sm"
              onClick={onHideIgnoredChange}
              className={hideIgnored ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
            >
              {hideIgnored ? "Hiding Ignored Games" : "Hide Ignored Games"}
            </Button>
            
            <Button
              variant={onlyUnplayed ? "default" : "outline"}
              size="sm"
              onClick={onOnlyUnplayedChange}
              className={onlyUnplayed ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
            >
              {onlyUnplayed ? "Showing Unplayed Only" : "Show Unplayed Only"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;

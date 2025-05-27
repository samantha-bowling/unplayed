
import React from 'react';
import { Search, X, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, EyeOff, Clock, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { SortOption } from '@/hooks/use-library-data';

interface LibraryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hideIgnored: boolean;
  onHideIgnoredChange: () => void;
  onlyUnplayed: boolean;
  onOnlyUnplayedChange: () => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  sortBy: SortOption;
  sortDirection: 'asc' | 'desc';
  onSortChange: (option: SortOption) => void;
  onResetFilters: () => void;
}

const LibraryFilters = ({
  searchQuery,
  onSearchChange,
  hideIgnored,
  onHideIgnoredChange,
  onlyUnplayed,
  onOnlyUnplayedChange,
  selectedGenre,
  onGenreChange,
  sortBy,
  sortDirection,
  onSortChange,
  onResetFilters,
}: LibraryFiltersProps) => {
  // Count active filters
  const activeFilterCount = (hideIgnored ? 1 : 0) + 
                           (onlyUnplayed ? 1 : 0) + 
                           (selectedGenre ? 1 : 0);

  const sortOptions = [
    { id: 'name', label: 'Name', icon: <ArrowDownAZ size={16} /> },
    { id: 'dust_score', label: 'Dust Score', icon: <Archive size={16} /> },
    { id: 'acquisition_date', label: 'Date Added', icon: <Clock size={16} /> },
    { id: 'playtime_minutes', label: 'Playtime', icon: <Clock size={16} /> },
  ];

  const getSortDisplayText = () => {
    const currentSort = sortOptions.find(option => option.id === sortBy);
    if (!currentSort) return 'Sort by Name';
    return `${currentSort.label} ${sortDirection === 'asc' ? '↑' : '↓'}`;
  };

  return (
    <div className="mb-6 bg-black/30 border border-gray-800 rounded-lg p-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search your game library..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-black/30 border-gray-700 focus:border-unplayed-mint focus:ring-1 focus:ring-unplayed-mint transition-all"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hideIgnored ? "default" : "outline"}
                  size="sm"
                  onClick={onHideIgnoredChange}
                  className={hideIgnored ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-colors" : ""}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide Ignored
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Hide games you've marked as ignored</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={onlyUnplayed ? "default" : "outline"}
                  size="sm"
                  onClick={onOnlyUnplayedChange}
                  className={onlyUnplayed ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-colors" : ""}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Only Unplayed
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Show only games with 0 minutes played</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Enhanced Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="group">
                <SlidersHorizontal className="h-4 w-4 mr-1 group-hover:text-unplayed-mint transition-colors" />
                <span className="hidden sm:inline">{getSortDisplayText()}</span>
                <span className="sm:hidden">Sort</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 bg-gray-900 border-gray-700" align="end">
              <div className="space-y-1">
                <div className="px-2 py-1 text-sm font-medium text-gray-300 border-b border-gray-700 mb-2">
                  Sort library by:
                </div>
                {sortOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start ${
                      sortBy === option.id 
                        ? 'bg-unplayed-mint/20 text-unplayed-mint hover:bg-unplayed-mint/30' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => onSortChange(option.id as SortOption)}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                    {sortBy === option.id && (
                      <span className="ml-auto text-sm">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Reset filters button */}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onResetFilters}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Reset {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {(selectedGenre) && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-400">Active filters:</span>
          
          {selectedGenre && (
            <Badge 
              variant="outline"
              className="bg-unplayed-mint/10 border-unplayed-mint/30 text-unplayed-mint flex items-center gap-1"
            >
              Genre: {selectedGenre}
              <button onClick={() => onGenreChange('')} className="ml-1 hover:text-white">
                <X size={14} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;


import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
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
}) => {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'dust_score', label: 'Dust Score' },
    { value: 'acquisition_date', label: 'Acquisition Date' },
    { value: 'playtime_minutes', label: 'Playtime' },
    { value: 'last_played_date', label: 'Last Played' },
  ];

  const getSortIcon = (option: SortOption) => {
    if (sortBy === option) {
      return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3" />;
  };

  const getSortButtonVariant = (option: SortOption) => {
    return sortBy === option ? "default" : "outline";
  };

  const hasActiveFilters = searchQuery || hideIgnored || onlyUnplayed || selectedGenre;

  return (
    <div className="bg-black/20 border border-unplayed-mint/20 rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-black/30 border-unplayed-mint/20 focus:border-unplayed-mint/60 text-white placeholder-gray-400"
        />
        {searchQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Badge variant="secondary" className="text-xs">
              Searching: "{searchQuery}"
            </Badge>
          </div>
        )}
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={hideIgnored ? "default" : "outline"}
          size="sm"
          onClick={onHideIgnoredChange}
          className={hideIgnored ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
        >
          Hide Ignored Games
        </Button>
        <Button
          variant={onlyUnplayed ? "default" : "outline"}
          size="sm"
          onClick={onOnlyUnplayedChange}
          className={onlyUnplayed ? "bg-unplayed-mint hover:bg-unplayed-mint/90" : ""}
        >
          Only Unplayed
        </Button>
        
        {/* Genre Filter */}
        <Select value={selectedGenre} onValueChange={onGenreChange}>
          <SelectTrigger className="w-48 bg-black/30 border-unplayed-mint/20">
            <SelectValue placeholder="Filter by genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Genres</SelectItem>
            <SelectItem value="Action">Action</SelectItem>
            <SelectItem value="Adventure">Adventure</SelectItem>
            <SelectItem value="RPG">RPG</SelectItem>
            <SelectItem value="Strategy">Strategy</SelectItem>
            <SelectItem value="Simulation">Simulation</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Racing">Racing</SelectItem>
            <SelectItem value="Puzzle">Puzzle</SelectItem>
            <SelectItem value="Platformer">Platformer</SelectItem>
            <SelectItem value="Fighting">Fighting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm text-gray-400 flex items-center mr-2">Sort by:</span>
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={getSortButtonVariant(option.value)}
            size="sm"
            onClick={() => onSortChange(option.value)}
            className={`flex items-center gap-1 ${
              sortBy === option.value 
                ? "bg-unplayed-amber hover:bg-unplayed-amber/90 text-black" 
                : ""
            }`}
          >
            {option.label}
            {getSortIcon(option.value)}
          </Button>
        ))}
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-gray-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;

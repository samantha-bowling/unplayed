
import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ScrollArea } from '@/components/ui/scroll-area';

const LibraryGamesTab = () => {
  const { games: libraryGames } = useLibraryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let filtered = libraryGames;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(game => {
        const playtime = game.userGame?.playtime_minutes || 0;
        if (filterBy === 'unplayed') return playtime === 0;
        if (filterBy === 'played') return playtime > 0;
        return true;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'playtime':
          aValue = a.userGame?.playtime_minutes || 0;
          bValue = b.userGame?.playtime_minutes || 0;
          break;
        case 'acquisition':
          aValue = a.userGame?.acquisition_date ? new Date(a.userGame.acquisition_date).getTime() : 0;
          bValue = b.userGame?.acquisition_date ? new Date(b.userGame.acquisition_date).getTime() : 0;
          break;
        case 'release':
          aValue = a.release_date ? new Date(a.release_date).getTime() : 0;
          bValue = b.release_date ? new Date(b.release_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });
  }, [libraryGames, searchTerm, sortBy, sortDirection, filterBy]);

  const formatPlaytime = (minutes: number) => {
    if (minutes === 0) return 'Never played';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="unplayed">Unplayed</SelectItem>
              <SelectItem value="played">Played</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="playtime">Playtime</SelectItem>
              <SelectItem value="acquisition">Date Added</SelectItem>
              <SelectItem value="release">Release Date</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
        
        <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as 'grid' | 'list')}>
          <ToggleGroupItem value="grid" aria-label="Grid View">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List View">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {filteredAndSortedGames.length} of {libraryGames.length} games
        </span>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-unplayed-mint hover:text-unplayed-mint/80"
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Games Display */}
      <ScrollArea className="h-[600px]">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSortedGames.map(game => {
              const playtime = game.userGame?.playtime_minutes || 0;
              const isUnplayed = playtime === 0;
              const gameImage = getBestGameImageFromDbData(game, game.id);
              
              return (
                <div key={game.id} className="group relative">
                  <div className="aspect-[460/215] w-full overflow-hidden rounded-md">
                    <img 
                      src={gameImage || '/placeholder.svg'} 
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-white text-sm font-medium truncate">{game.name}</p>
                    <p className={`text-xs ${isUnplayed ? 'text-unplayed-red' : 'text-unplayed-mint'}`}>
                      {formatPlaytime(playtime)}
                    </p>
                  </div>
                  
                  {isUnplayed && (
                    <div className="absolute top-2 right-2 bg-unplayed-red rounded-full w-3 h-3" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedGames.map(game => {
              const playtime = game.userGame?.playtime_minutes || 0;
              const isUnplayed = playtime === 0;
              const gameImage = getBestGameImageFromDbData(game, game.id);
              
              return (
                <div key={game.id} className="flex items-center gap-4 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                  <div className="w-16 h-9 flex-shrink-0">
                    <AspectRatio ratio={16 / 9}>
                      <img 
                        src={gameImage || '/placeholder.svg'} 
                        alt={game.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{game.name}</h3>
                    <p className="text-sm text-gray-400">
                      {game.release_date ? new Date(game.release_date).getFullYear() : 'Unknown year'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={isUnplayed ? "destructive" : "default"} className="mb-1">
                      {formatPlaytime(playtime)}
                    </Badge>
                    {game.genres && game.genres.length > 0 && (
                      <p className="text-xs text-gray-500">{game.genres.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {filteredAndSortedGames.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No games found matching your criteria.</p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LibraryGamesTab;

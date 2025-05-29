
import { GameDustData } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ghost } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';

interface TopDustContributorsProps {
  contributors: GameDustData[];
}

type SortKey = 'dustScore' | 'releaseDate' | 'playtimeMinutes';
type SortOrder = 'asc' | 'desc';

const TopDustContributors = ({ contributors }: TopDustContributorsProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('dustScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [limitResults, setLimitResults] = useState<number>(10);
  
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle order if same key
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New key, set default order
      setSortKey(key);
      setSortOrder('desc');
    }
  };
  
  const sortedContributors = [...contributors].sort((a, b) => {
    let comparison = 0;
    
    switch (sortKey) {
      case 'dustScore':
        comparison = a.dustScore - b.dustScore;
        break;
      case 'releaseDate':
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'playtimeMinutes':
        comparison = a.playtimeMinutes - b.playtimeMinutes;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  }).slice(0, limitResults);
  
  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  if (contributors.length === 0) {
    return (
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Top Dust Contributors</CardTitle>
          <CardDescription>Games that contribute the most to your dust score</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <p className="text-gray-400">No games found</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ghost className="h-5 w-5 text-unplayed-pink" />
          Top Dust Contributors
        </CardTitle>
        <CardDescription>
          Games that contribute the most to your Dust Score
        </CardDescription>
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-gray-400">Show top:</span>
          <Select value={limitResults.toString()} onValueChange={(value) => setLimitResults(parseInt(value))}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-400">games</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-unplayed-mint"
                  onClick={() => handleSort('dustScore')}
                >
                  Dust Score {getSortIcon('dustScore')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-unplayed-mint hidden md:table-cell"
                  onClick={() => handleSort('releaseDate')}
                >
                  Release Date {getSortIcon('releaseDate')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-unplayed-mint hidden md:table-cell"
                  onClick={() => handleSort('playtimeMinutes')}
                >
                  Playtime {getSortIcon('playtimeMinutes')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContributors.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="flex items-center gap-2">
                    {game.image ? (
                      <img 
                        src={game.image} 
                        alt={game.name} 
                        className="h-8 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-8 w-16 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">
                        No image
                      </div>
                    )}
                    <span className="line-clamp-1">{game.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-unplayed-mint">{game.dustScore}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {game.releaseDate ? (
                      format(parseISO(game.releaseDate), 'MMM d, yyyy')
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {game.playtimeMinutes === 0 ? (
                      <span className="text-gray-500">Unplayed</span>
                    ) : (
                      `${Math.floor(game.playtimeMinutes / 60)}h ${game.playtimeMinutes % 60}m`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TopDustContributors;

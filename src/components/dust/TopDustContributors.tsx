
import { GameDustData } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ghost } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from 'react';

interface TopDustContributorsProps {
  contributors: GameDustData[];
}

type SortKey = 'dustScore' | 'addedDate' | 'playtimeMinutes';
type SortOrder = 'asc' | 'desc';

const TopDustContributors = ({ contributors }: TopDustContributorsProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('dustScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
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
      case 'addedDate':
        comparison = new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        break;
      case 'playtimeMinutes':
        comparison = a.playtimeMinutes - b.playtimeMinutes;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
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
      </CardHeader>
      <CardContent>
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
                onClick={() => handleSort('addedDate')}
              >
                Owned Since {getSortIcon('addedDate')}
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
                  {game.imageUrl ? (
                    <img 
                      src={game.imageUrl} 
                      alt={game.title} 
                      className="h-8 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-16 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}
                  <span className="line-clamp-1">{game.title}</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-unplayed-mint">{game.dustScore}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(parseISO(game.addedDate), 'MMM d, yyyy')}
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
      </CardContent>
    </Card>
  );
};

export default TopDustContributors;


import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShelfLifeHeaderProps {
  displayCount: string;
  setDisplayCount: (count: string) => void;
  hasGames: boolean;
}

const ShelfLifeHeader: React.FC<ShelfLifeHeaderProps> = ({
  displayCount,
  setDisplayCount,
  hasGames
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <h3 className="terminal-header text-2xl">Shelf Life</h3>
      <div className="flex items-center gap-3">
        <Select value={displayCount} onValueChange={setDisplayCount}>
          <SelectTrigger className="w-32 h-8 text-xs bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Top 10" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="10" className="text-white hover:bg-gray-700">Top 10</SelectItem>
            <SelectItem value="25" className="text-white hover:bg-gray-700">Top 25</SelectItem>
            <SelectItem value="50" className="text-white hover:bg-gray-700">Top 50</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ShelfLifeHeader;

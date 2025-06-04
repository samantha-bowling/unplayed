
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLibraryData } from '@/hooks/use-library-data';
import { useLibraryDataDebug } from '@/hooks/use-library-data-debug';
import { Bug } from 'lucide-react';

const LibraryDebugInfo = () => {
  const { games: standardGames } = useLibraryData();
  const { games: debugGames, totalCount } = useLibraryDataDebug();

  return (
    <Card className="bg-red-900/20 border border-red-500/30 mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-400">
          <Bug className="h-5 w-5" />
          <span>DEBUG: Game Count Investigation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-red-300">Standard useLibraryData():</p>
            <p className="text-white font-mono">{standardGames.length} games</p>
          </div>
          <div>
            <p className="text-red-300">Debug useLibraryDataDebug():</p>
            <p className="text-white font-mono">{debugGames.length} games</p>
          </div>
        </div>
        <div className="pt-2 border-t border-red-500/30">
          <p className="text-red-300">Expected from screenshots: <span className="text-white font-mono">1621 games</span></p>
          <p className="text-red-300">Total count from debug: <span className="text-white font-mono">{totalCount} games</span></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryDebugInfo;

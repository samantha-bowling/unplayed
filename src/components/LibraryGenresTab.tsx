
import React from 'react';
import GenreHoarding from '@/components/GenreHoarding';
import GenreWordCloud from '@/components/GenreWordCloud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, BarChart3, TrendingUp } from 'lucide-react';

const LibraryGenresTab = () => {
  return (
    <div className="space-y-6">
      {/* Genre Distribution */}
      <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-unplayed-mint" />
            <span>Genre Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GenreHoarding />
        </CardContent>
      </Card>

      {/* Genre Word Cloud */}
      <GenreWordCloud />

      {/* Genre Trends - Placeholder for future implementation */}
      <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Genre Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            <p>Coming soon</p>
            <p className="text-sm">Track how your genre preferences evolve over time</p>
          </div>
        </CardContent>
      </Card>

      {/* Genre Analytics - Placeholder for future implementation */}
      <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-purple-400" />
            <span>Genre Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            <p>Coming soon</p>
            <p className="text-sm">Deep dive into your gaming genre statistics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryGenresTab;

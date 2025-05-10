
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind } from 'lucide-react';

interface DustScorePerGameProps {
  avgDustScore: number;
  totalGames: number;
  unplayedGames: number;
}

const DustScorePerGame = ({ avgDustScore, totalGames, unplayedGames }: DustScorePerGameProps) => {
  const getTierColor = (score: number) => {
    if (score < 10) return 'bg-green-400';
    if (score < 25) return 'bg-green-500';
    if (score < 40) return 'bg-yellow-400';
    if (score < 60) return 'bg-orange-400';
    if (score < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getTierName = (score: number) => {
    if (score < 10) return 'Fresh Shelf';
    if (score < 25) return 'Low Dust';
    if (score < 40) return 'Dusty Corners';
    if (score < 60) return 'Dust Accumulation';
    if (score < 80) return 'Digital Detritus';
    return 'Fossilized Collection';
  };
  
  const getDustScorePercentage = () => {
    return (avgDustScore / 100) * 100;
  };
  
  const playedPercentage = totalGames > 0 ? ((totalGames - unplayedGames) / totalGames) * 100 : 0;
  
  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-unplayed-amber" />
          Dust Score Analysis
        </CardTitle>
        <CardDescription>
          Your dust score metrics and completion statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-sm text-gray-400">Average Dust Per Game</h3>
            <p className="text-4xl font-bold text-unplayed-mint mt-2">{avgDustScore}</p>
            <p className="text-sm text-gray-400 mt-1">dust units</p>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-sm text-gray-400">Completion Rate</h3>
            <p className="text-4xl font-bold text-unplayed-amber mt-2">{Math.round(playedPercentage)}%</p>
            <p className="text-sm text-gray-400 mt-1">played games</p>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-sm text-gray-400">Dust Tier</h3>
            <p className="text-2xl font-bold mt-2 text-unplayed-pink">{getTierName(avgDustScore)}</p>
            <p className="text-sm text-gray-400 mt-1">based on average score</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Dust Distribution</h3>
            <div className="h-6 w-full bg-gray-800 rounded-full overflow-hidden flex">
              <div className={`${getTierColor(avgDustScore)}`} style={{ width: `${getDustScorePercentage()}%` }}></div>
            </div>
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-green-400">Fresh (0)</span>
              <span className="text-yellow-400">Dusty (50)</span>
              <span className="text-red-500">Fossilized (100)</span>
            </div>
          </div>
          
          <div className="bg-black/30 p-5 rounded-lg">
            <h3 className="text-lg font-medium mb-3">What Your Dust Score Means</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-green-400"></div>
                  <h4 className="font-medium text-green-400">Fresh Shelf (0-9)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  You're actively playing your games. Excellent library management!
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <h4 className="font-medium text-green-500">Low Dust (10-24)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  Minor neglect, but your library is in good shape overall.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                  <h4 className="font-medium text-yellow-400">Dusty Corners (25-39)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  Some games are gathering dust. Time for spring cleaning?
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                  <h4 className="font-medium text-orange-400">Dust Accumulation (40-59)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  Your backlog is growing. Consider focusing on these games soon.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <h4 className="font-medium text-orange-500">Digital Detritus (60-79)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  Significant neglect detected. Your games feel abandoned.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <h4 className="font-medium text-red-500">Fossilized Collection (80-100)</h4>
                </div>
                <p className="text-sm text-gray-400 pl-6">
                  Critical neglect level. These games are now ancient artifacts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScorePerGame;

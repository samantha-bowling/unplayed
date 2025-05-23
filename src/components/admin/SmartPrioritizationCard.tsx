
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScoringWeights {
  userOwned: number;
  metacriticScore: number;
  recentRelease: number;
  priceRange: number;
  popularGenres: number;
  hasEstimate: number;
}

interface SmartPrioritizationResponse {
  success: boolean;
  message: string;
  analysis: {
    totalAnalyzed: number;
    topGamesSelected: number;
    userOwnedGames: number;
    gamesWithEstimates: number;
    averageScore: number;
  };
  dryRun: boolean;
  updated: number;
  topGames: Array<{
    name: string;
    score: number;
    userOwned: boolean;
    metacriticScore?: number;
    price?: number;
  }>;
}

const SmartPrioritizationCard: React.FC = () => {
  const [targetCount, setTargetCount] = useState<number>(5000);
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SmartPrioritizationResponse | null>(null);

  // Scoring weights with default values
  const [weights, setWeights] = useState<ScoringWeights>({
    userOwned: 100,
    metacriticScore: 30,
    recentRelease: 20,
    priceRange: 15,
    popularGenres: 10,
    hasEstimate: -50
  });

  const handleSmartPrioritization = async () => {
    try {
      setIsProcessing(true);
      
      if (!dryRun) {
        toast.info("Starting smart prioritization...");
      } else {
        toast.info("Running analysis (dry run)...");
      }

      console.log('Calling smart prioritization with:', { targetCount, weights, dryRun });
      
      const { data, error } = await supabase.functions.invoke('prioritize-smart-queue', {
        body: {
          targetCount,
          weights,
          dryRun
        }
      });

      if (error) {
        console.error('Smart prioritization error:', error);
        toast.error(`Error: ${error.message}`);
        return;
      }

      setLastResult(data);
      
      if (dryRun) {
        toast.success(`Analysis complete! Found ${data.analysis.topGamesSelected} top games for prioritization`);
      } else {
        toast.success(`Successfully prioritized ${data.updated} games in the queue!`);
      }

      console.log('Smart prioritization result:', data);

    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateWeight = (key: keyof ScoringWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Queue Prioritization
        </CardTitle>
        <CardDescription>
          Use AI-powered scoring to prioritize the most valuable games in the queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Count */}
        <div className="space-y-2">
          <Label htmlFor="target-count">Target Game Count</Label>
          <Input
            id="target-count"
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            min={100}
            max={50000}
            step={100}
          />
          <p className="text-xs text-muted-foreground">
            Number of top games to prioritize (recommended: 5,000)
          </p>
        </div>

        {/* Scoring Weights */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Scoring Weights</Label>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">User-Owned Games</Label>
                <span className="text-sm text-muted-foreground">{weights.userOwned}</span>
              </div>
              <Slider
                value={[weights.userOwned]}
                onValueChange={([value]) => updateWeight('userOwned', value)}
                min={0}
                max={200}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Metacritic Score</Label>
                <span className="text-sm text-muted-foreground">{weights.metacriticScore}</span>
              </div>
              <Slider
                value={[weights.metacriticScore]}
                onValueChange={([value]) => updateWeight('metacriticScore', value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Recent Release</Label>
                <span className="text-sm text-muted-foreground">{weights.recentRelease}</span>
              </div>
              <Slider
                value={[weights.recentRelease]}
                onValueChange={([value]) => updateWeight('recentRelease', value)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Price Range</Label>
                <span className="text-sm text-muted-foreground">{weights.priceRange}</span>
              </div>
              <Slider
                value={[weights.priceRange]}
                onValueChange={([value]) => updateWeight('priceRange', value)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Popular Genres</Label>
                <span className="text-sm text-muted-foreground">{weights.popularGenres}</span>
              </div>
              <Slider
                value={[weights.popularGenres]}
                onValueChange={([value]) => updateWeight('popularGenres', value)}
                min={0}
                max={30}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Has Estimate (Penalty)</Label>
                <span className="text-sm text-muted-foreground">{weights.hasEstimate}</span>
              </div>
              <Slider
                value={[weights.hasEstimate]}
                onValueChange={([value]) => updateWeight('hasEstimate', value)}
                min={-100}
                max={0}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Dry Run Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="dry-run"
            checked={dryRun}
            onCheckedChange={setDryRun}
          />
          <Label htmlFor="dry-run">Dry Run (Analysis Only)</Label>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSmartPrioritization}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {dryRun ? 'Analyzing...' : 'Prioritizing...'}
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {dryRun ? 'Analyze Queue' : 'Apply Prioritization'}
            </>
          )}
        </Button>

        {/* Results Display */}
        {lastResult && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Results</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Games Analyzed</p>
                <p className="text-2xl font-bold">{lastResult.analysis.totalAnalyzed.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Top Games Selected</p>
                <p className="text-2xl font-bold">{lastResult.analysis.topGamesSelected.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">User-Owned</p>
                <p className="text-xl font-semibold text-green-600">{lastResult.analysis.userOwnedGames}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-xl font-semibold">{lastResult.analysis.averageScore}</p>
              </div>
            </div>

            {lastResult.topGames.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Top Prioritized Games:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {lastResult.topGames.slice(0, 10).map((game, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                      <span className="truncate">{game.name}</span>
                      <div className="flex items-center gap-2">
                        {game.userOwned && <Badge variant="secondary" className="text-xs">User Owned</Badge>}
                        <span className="font-mono">{game.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPrioritizationCard;

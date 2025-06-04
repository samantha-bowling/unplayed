
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Image, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { callSupabaseFunction } from '@/utils/supabase-functions';

interface EnhancementResult {
  success: boolean;
  completed: boolean;
  total: number;
  enhanced: number;
  failed: number;
  skipped: number;
  enhancementType: string;
  description: string;
  details: Array<{
    appId: number;
    name: string;
    success: boolean;
    enhanced: boolean;
    error?: string;
  }>;
}

const HeaderImageEnhancementCard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementType, setEnhancementType] = useState<string>('missing_headers');
  const [batchSize, setBatchSize] = useState<number>(20);
  const [lastResult, setLastResult] = useState<EnhancementResult | null>(null);

  const enhancementTypes = [
    {
      value: 'missing_headers',
      label: 'Missing Headers',
      description: 'Games with no header_image or placeholder values',
      priority: 'High'
    },
    {
      value: 'failed_queue',
      label: 'Failed Queue Items',
      description: 'Games that failed in the processing queue',
      priority: 'High'
    },
    {
      value: 'low_quality',
      label: 'Low Quality Images',
      description: 'Games with potentially low-quality header images',
      priority: 'Medium'
    }
  ];

  const selectedType = enhancementTypes.find(type => type.value === enhancementType);

  const handleEnhancement = async () => {
    try {
      setIsProcessing(true);
      toast.info(`Starting ${selectedType?.label} enhancement...`);
      
      const result = await callSupabaseFunction<EnhancementResult>('enhance-header-images', {
        enhancementType,
        batchSize
      });
      
      setLastResult(result);
      
      if (result.enhanced > 0) {
        toast.success(`Enhanced ${result.enhanced} games! ${result.failed} failed, ${result.skipped} skipped.`);
      } else if (result.total === 0) {
        toast.info('No games found that need enhancement for this type.');
      } else {
        toast.warning(`No games were enhanced. ${result.failed} failed, ${result.skipped} already good.`);
      }
      
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance header images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-700/20 border-purple-400/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Image className="mr-2 h-5 w-5" />
          Header Image Enhancement
        </CardTitle>
        <CardDescription>
          Systematically enhance game header images using Steam Store API for better image quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhancement Type Selection */}
        <div className="space-y-2">
          <Label>Enhancement Type</Label>
          <Select value={enhancementType} onValueChange={setEnhancementType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enhancementTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{type.label}</span>
                    <Badge 
                      variant={type.priority === 'High' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {type.priority}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedType && (
            <p className="text-sm text-gray-400">{selectedType.description}</p>
          )}
        </div>

        {/* Batch Size Control */}
        <div className="space-y-2">
          <Label>Batch Size: {batchSize} games</Label>
          <Slider
            value={[batchSize]}
            onValueChange={(value) => setBatchSize(value[0])}
            min={5}
            max={50}
            step={5}
            className="py-4"
          />
          <p className="text-xs text-gray-400">
            Smaller batches are gentler on Steam's API. Recommended: 20-30 games.
          </p>
        </div>

        {/* Enhancement Button */}
        <Button
          onClick={handleEnhancement}
          disabled={isProcessing}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enhancing Images...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Enhance {selectedType?.label}
            </>
          )}
        </Button>

        {/* Results Display */}
        {lastResult && (
          <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Last Enhancement Results</h4>
              <Badge variant="outline">{lastResult.enhancementType}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{lastResult.total}</div>
                <div className="text-xs text-gray-400">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{lastResult.enhanced}</div>
                <div className="text-xs text-gray-400">Enhanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{lastResult.failed}</div>
                <div className="text-xs text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{lastResult.skipped}</div>
                <div className="text-xs text-gray-400">Skipped</div>
              </div>
            </div>

            {lastResult.details && lastResult.details.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                <p className="text-sm font-medium text-gray-300">Sample Results:</p>
                {lastResult.details.slice(0, 5).map((detail, index) => (
                  <div key={index} className="flex items-center text-xs">
                    {detail.enhanced ? (
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                    ) : detail.success ? (
                      <Info className="h-3 w-3 text-yellow-400 mr-2" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-400 mr-2" />
                    )}
                    <span className="truncate">{detail.name}</span>
                  </div>
                ))}
                {lastResult.details.length > 5 && (
                  <p className="text-xs text-gray-500">...and {lastResult.details.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Information Panel */}
        <div className="text-xs text-gray-400 space-y-1 p-3 bg-black/10 rounded">
          <p>• <strong>Missing Headers:</strong> Targets games with no header_image data</p>
          <p>• <strong>Failed Queue:</strong> Retries games that failed during initial processing</p>
          <p>• <strong>Low Quality:</strong> Identifies and upgrades potentially low-res images</p>
          <p>• Rate limited to respect Steam's API (250ms between requests)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeaderImageEnhancementCard;

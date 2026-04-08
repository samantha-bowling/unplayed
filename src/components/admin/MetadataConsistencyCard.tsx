
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { toast } from 'sonner';

interface ConsistencyResult {
  fixed: number;
  errors: string[];
  details?: any;
}

const MetadataConsistencyCard = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ConsistencyResult | null>(null);

  const handleFixMetadata = async () => {
    setIsProcessing(true);
    try {
      const result = await callSupabaseFunction('fix-inconsistent-metadata', {});
      
      setLastResult({
        fixed: result.fixed || 0,
        errors: result.errors || [],
        details: result
      });

      if (result.fixed > 0) {
        toast.success(`Fixed ${result.fixed} metadata inconsistencies`);
      } else {
        toast.info('No metadata inconsistencies found');
      }
    } catch (error) {
      console.error('Error fixing metadata:', error);
      toast.error(`Failed to fix metadata: ${error.message}`);
      setLastResult({
        fixed: 0,
        errors: [error.message],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleFixMetadata}
        disabled={isProcessing}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fixing Metadata...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Fix Metadata Inconsistencies
          </>
        )}
      </Button>
      
      {lastResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {lastResult.fixed > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
            <span className="text-sm">
              Last run: {lastResult.fixed} issues fixed
            </span>
          </div>
          
          {lastResult.errors.length > 0 && (
            <div className="space-y-1">
              <Badge variant="destructive" className="text-xs">
                {lastResult.errors.length} errors
              </Badge>
              <div className="max-h-32 overflow-y-auto text-xs text-gray-400">
                {lastResult.errors.map((error, idx) => (
                  <div key={idx} className="break-words">{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetadataConsistencyCard;

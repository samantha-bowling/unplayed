import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RETENTION_DAYS } from '@/lib/feature-flags';

interface CleanupStats {
  queueDeleted: number;
  syncDeleted: number;
  totalDeleted: number;
  executedAt: string;
}

export const DatabaseCleanupCard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [lastStats, setLastStats] = useState<CleanupStats | null>(null);
  const [previewStats, setPreviewStats] = useState<CleanupStats | null>(null);

  const runCleanup = async (preview: boolean) => {
    if (preview) {
      setIsPreviewing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-old-data', {
        body: { preview },
      });

      if (error) throw error;

      if (preview) {
        setPreviewStats(data.stats);
        toast.info(`Preview: ${data.stats.totalDeleted} records can be cleaned`);
      } else {
        setLastStats(data.stats);
        setPreviewStats(null);
        toast.success(`Cleanup complete: ${data.stats.totalDeleted} records deleted`);
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(error.message || 'Cleanup failed');
    } finally {
      setIsLoading(false);
      setIsPreviewing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Database Cleanup
        </CardTitle>
        <CardDescription>
          Clean up old queue and sync records to free database space.
          Only affects system tables - no user data is touched.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Retention Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Queue entries (completed/failed): {RETENTION_DAYS.COMPLETED_QUEUE_ITEMS} days retention</p>
          <p>• Sync records: {RETENTION_DAYS.OLD_SYNC_RECORDS} days retention</p>
        </div>

        {/* Preview Stats */}
        {previewStats && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Results
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Queue entries: <span className="font-mono">{previewStats.queueDeleted}</span></div>
              <div>Sync records: <span className="font-mono">{previewStats.syncDeleted}</span></div>
            </div>
            <p className="text-sm font-medium">
              Total: {previewStats.totalDeleted} records can be deleted
            </p>
          </div>
        )}

        {/* Last Cleanup Stats */}
        {lastStats && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Last Cleanup
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Queue entries: <span className="font-mono">{lastStats.queueDeleted}</span></div>
              <div>Sync records: <span className="font-mono">{lastStats.syncDeleted}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(lastStats.executedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runCleanup(true)}
            disabled={isLoading || isPreviewing}
          >
            {isPreviewing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button
            variant="destructive"
            onClick={() => runCleanup(false)}
            disabled={isLoading || isPreviewing}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Run Cleanup
          </Button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            This action is irreversible. Deleted records cannot be recovered.
            Only completed/failed queue items and old sync records are affected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

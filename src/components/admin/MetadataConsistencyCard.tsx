
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, AlertTriangle } from 'lucide-react';

const MetadataConsistencyCard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get metadata consistency stats
  const { data: consistencyStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['metadata-consistency-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fix-inconsistent-metadata', {
        body: { action: 'check' }
      });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation to fix metadata inconsistencies
  const fixMetadataMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fix-inconsistent-metadata', {
        body: { action: 'fix' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Metadata Fix Complete",
        description: `Fixed ${data.fixed_count || 0} inconsistent records.`,
      });
      queryClient.invalidateQueries({ queryKey: ['metadata-consistency-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to fix metadata inconsistencies.",
        variant: "destructive",
      });
      console.error('Metadata fix error:', error);
    },
  });

  const handleFixMetadata = () => {
    fixMetadataMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Metadata Consistency
        </CardTitle>
        <CardDescription>
          Monitor and fix inconsistencies between games and user_games tables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">
                {consistencyStats?.consistent_records || 0}
              </div>
              <div className="text-sm text-green-600">Consistent Records</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-700 flex items-center gap-1">
                {consistencyStats?.inconsistent_records || 0}
                {(consistencyStats?.inconsistent_records || 0) > 0 && (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div className="text-sm text-red-600">Inconsistent Records</div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleFixMetadata}
          disabled={fixMetadataMutation.isPending || isLoadingStats}
          className="w-full"
        >
          {fixMetadataMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Fixing Metadata...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Fix Metadata Inconsistencies
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MetadataConsistencyCard;

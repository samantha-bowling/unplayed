
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from '@/layouts/AdminLayout';
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import { fixInconsistentMetadata, FixMetadataOptions, FixMetadataResponse } from "@/utils/fix-metadata";

const AdminDataManagerPage = () => {
  const [metadataResult, setMetadataResult] = useState<FixMetadataResponse | null>(null);
  const [isFixingMetadata, setIsFixingMetadata] = useState(false);

  const handleFixInconsistentMetadata = async (dryRun: boolean = true) => {
    try {
      setIsFixingMetadata(true);
      
      if (dryRun) {
        toast.info("Analyzing games with inconsistent metadata...");
      } else {
        toast.info("Fixing inconsistent metadata - re-queueing games...");
      }

      const options: FixMetadataOptions = {
        dryRun,
        prioritizeUserGames: true
      };

      const result = await fixInconsistentMetadata(options);
      setMetadataResult(result);

      if (dryRun) {
        toast.success(`Analysis complete! Found ${result.inconsistentCount} games with inconsistent metadata`);
      } else {
        toast.success(`Successfully queued ${result.totalQueued} games for metadata update!`);
      }

      console.log('Metadata fix result:', result);
    } catch (err: any) {
      console.error('Error fixing metadata:', err);
      toast.error(`Error: ${err.message || 'Failed to fix metadata'}`);
    } finally {
      setIsFixingMetadata(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Manager</h1>
          <p className="text-muted-foreground">
            Manage and monitor metadata integrations for your game catalog.
          </p>
        </div>

        {/* Metadata Consistency Card */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5" />
                Metadata Consistency
              </CardTitle>
              <CardDescription>
                Fix games with inconsistent image metadata by re-queueing them for Steam Store API updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  This will identify games that have image_url but missing header_image, then re-queue them 
                  for processing with the updated Steam Store API logic to ensure consistent metadata.
                </p>
                <p className="text-muted-foreground">
                  User-owned games will be prioritized for faster processing.
                </p>
              </div>

              {metadataResult && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">
                    {metadataResult.dryRun ? 'Analysis Results' : 'Fix Results'}
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Inconsistent Games</p>
                      <p className="font-bold text-lg">{metadataResult.inconsistentCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">User-Owned</p>
                      <p className="font-bold text-lg text-green-600">{metadataResult.userOwnedCount}</p>
                    </div>
                    {metadataResult.dryRun ? (
                      <div>
                        <p className="text-muted-foreground">Would Queue</p>
                        <p className="font-bold text-lg text-blue-600">{metadataResult.wouldQueue || 0}</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-muted-foreground">Queued</p>
                          <p className="font-bold text-lg text-blue-600">{metadataResult.totalQueued || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className="font-bold text-lg text-red-600">{metadataResult.totalErrors || 0}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {metadataResult.sampleGames && metadataResult.sampleGames.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sample games to be processed:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {metadataResult.sampleGames.slice(0, 5).map((game, index) => (
                          <div key={index} className="text-xs p-2 bg-background rounded flex justify-between">
                            <span className="truncate">{game.name}</span>
                            <span className="text-muted-foreground ml-2">Priority: {game.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metadataResult.nextSteps && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Next Steps:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {metadataResult.nextSteps.map((step, index) => (
                          <li key={index}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardHeader className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ProcessingFooter
                  isProcessing={isFixingMetadata}
                  onProcess={() => handleFixInconsistentMetadata(true)}
                  processText="Analyze Metadata (Dry Run)"
                  processingText="Analyzing..."
                />
                <ProcessingFooter
                  isProcessing={isFixingMetadata}
                  onProcess={() => handleFixInconsistentMetadata(false)}
                  processText="Fix Metadata (Live)"
                  processingText="Fixing..."
                />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDataManagerPage;

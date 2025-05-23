
import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface BatchProcessingControlsProps {
  batchSize: number;
  onBatchSizeChange: (value: number) => void;
  batchSizeMin?: number;
  batchSizeMax?: number;
  batchSizeStep?: number;
  batchSizeLabel?: string;
  
  processLimit?: number;
  onProcessLimitChange?: (value: number) => void;
  processLimitMin?: number;
  processLimitMax?: number;
  processLimitStep?: number;
  processLimitLabel?: string;
  
  continuousMode?: boolean;
  processedCount?: number;
  lastProcessedId?: number;
  processComplete?: boolean;
  showWarningThreshold?: number;
  warningMessage?: string;
}

const BatchProcessingControls: React.FC<BatchProcessingControlsProps> = ({
  batchSize,
  onBatchSizeChange,
  batchSizeMin = 5,
  batchSizeMax = 50,
  batchSizeStep = 5,
  batchSizeLabel = "Batch Size",
  
  processLimit,
  onProcessLimitChange,
  processLimitMin = 10,
  processLimitMax = 500,
  processLimitStep = 10,
  processLimitLabel = "Process Limit",
  
  continuousMode = false,
  processedCount = 0,
  lastProcessedId = 0,
  processComplete = false,
  showWarningThreshold,
  warningMessage = "Higher values may cause issues",
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="batch-size">{batchSizeLabel}: {batchSize}</Label>
          {showWarningThreshold && batchSize > showWarningThreshold && (
            <div className="flex items-center text-amber-500 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningMessage}
            </div>
          )}
        </div>
        <Slider
          id="batch-size"
          min={batchSizeMin}
          max={batchSizeMax}
          step={batchSizeStep}
          value={[batchSize]}
          onValueChange={(value) => onBatchSizeChange(value[0])}
          className="py-4"
        />
      </div>

      {processLimit !== undefined && onProcessLimitChange && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="process-limit">{processLimitLabel}: {processLimit}</Label>
            {processLimit > 200 && (
              <div className="flex items-center text-amber-500 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Large batch may timeout
              </div>
            )}
          </div>
          <Slider
            id="process-limit"
            min={processLimitMin}
            max={processLimitMax}
            step={processLimitStep}
            value={[processLimit]}
            onValueChange={(value) => onProcessLimitChange(value[0])}
            className="py-4"
          />
        </div>
      )}

      {processedCount > 0 && (
        <div className="rounded-md bg-blue-950/50 p-3 border border-blue-800">
          <div className="text-sm text-blue-400">
            <span className="font-medium">Progress:</span> Processed {processedCount} items
            {processComplete && <span className="ml-2 text-green-400">(Complete)</span>}
          </div>
          {lastProcessedId > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Last processed ID: {lastProcessedId}
            </div>
          )}
        </div>
      )}

      {continuousMode && (
        <div className="rounded-md bg-purple-950/50 p-3 border border-purple-800">
          <div className="flex items-center text-purple-400 mb-2">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm font-medium">Continuous Mode Active</span>
          </div>
          <p className="text-xs text-gray-400">
            Automatically processing batches with intervals between batches.
          </p>
        </div>
      )}
    </div>
  );
};

export default BatchProcessingControls;

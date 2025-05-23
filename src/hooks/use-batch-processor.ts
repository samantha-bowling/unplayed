
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Define an interface for the expected response from the processing function
interface BatchProcessResponse {
  lastProcessedId?: number;
  complete?: boolean;
  processedCount?: number;
  successCount?: number;
  errorCount?: number;
  [key: string]: any; // Allow for additional properties
}

interface BatchProcessorOptions<T extends BatchProcessResponse> {
  processingFunction: (options: any) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
  continuousInterval?: number;
}

interface BatchProcessorState {
  isProcessing: boolean;
  continuousMode: boolean;
  processedCount: number;
  lastProcessedId: number;
  processComplete: boolean;
  batchSize: number;
  processLimit?: number;
}

export function useBatchProcessor<T extends BatchProcessResponse>({
  processingFunction,
  onSuccess,
  onError,
  onComplete,
  continuousInterval = 5000,
}: BatchProcessorOptions<T>) {
  const [state, setState] = useState<BatchProcessorState>({
    isProcessing: false,
    continuousMode: false,
    processedCount: 0,
    lastProcessedId: 0,
    processComplete: false,
    batchSize: 10,
    processLimit: undefined,
  });

  const setBatchSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, batchSize: size }));
  }, []);

  const setProcessLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, processLimit: limit }));
  }, []);

  const resetProcessor = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastProcessedId: 0,
      processComplete: false,
      processedCount: 0,
    }));
    toast.info("Processor reset. Will start from the beginning.");
  }, []);

  const toggleContinuousMode = useCallback(() => {
    setState(prev => {
      const newContinuousMode = !prev.continuousMode;
      if (newContinuousMode && !prev.processComplete) {
        toast.info("Continuous processing enabled. This will automatically process batches until complete or paused.");
      } else if (!newContinuousMode) {
        toast.info("Continuous processing paused.");
      }
      return { ...prev, continuousMode: newContinuousMode };
    });
  }, []);

  const processBatch = useCallback(async (customOptions?: Record<string, any>) => {
    if (state.isProcessing || state.processComplete) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const options = {
        batchSize: state.batchSize,
        ...(state.processLimit !== undefined && { limit: state.processLimit }),
        ...(state.lastProcessedId > 0 && { startAfter: state.lastProcessedId }),
        ...customOptions,
      };

      const result = await processingFunction(options);
      
      if (result) {
        // Update state based on result
        setState(prev => ({
          ...prev,
          lastProcessedId: result.lastProcessedId || prev.lastProcessedId,
          processComplete: result.complete || prev.processComplete,
          processedCount: prev.processedCount + (result.processedCount || 0),
        }));

        if (onSuccess) onSuccess(result);
        
        if (result.complete) {
          toast.success("Processing complete! No more items to process.");
          if (onComplete) onComplete();
          setState(prev => ({ ...prev, continuousMode: false }));
        }
      }
    } catch (err) {
      console.error("Error processing batch:", err);
      toast.error("Error occurred while processing batch");
      if (onError) onError(err);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    state.isProcessing, 
    state.processComplete, 
    state.batchSize,
    state.processLimit,
    state.lastProcessedId,
    processingFunction,
    onSuccess,
    onError,
    onComplete
  ]);

  // Effect for continuous mode
  useEffect(() => {
    let intervalId: number | undefined;

    if (state.continuousMode && !state.isProcessing && !state.processComplete) {
      intervalId = window.setInterval(async () => {
        await processBatch();
      }, continuousInterval);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [
    state.continuousMode, 
    state.isProcessing, 
    state.processComplete,
    processBatch,
    continuousInterval
  ]);

  return {
    processBatch,
    setBatchSize,
    setProcessLimit,
    resetProcessor,
    toggleContinuousMode,
    ...state
  };
}


import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Interface for the expected response from batch processing functions
 * Any function used with useBatchProcessor should return an object conforming to this interface
 */
export interface BatchProcessResponse {
  lastProcessedId?: number;
  complete?: boolean;
  processedCount?: number;
  successCount?: number;
  errorCount?: number;
  [key: string]: any; // Allow for additional properties
}

/**
 * Configuration options for the batch processor hook
 * @template T Type of the response from the processing function (must extend BatchProcessResponse)
 */
export interface BatchProcessorOptions<T extends BatchProcessResponse> {
  /** Function that performs the batch processing and returns a promise */
  processingFunction: (options: any) => Promise<T>;
  /** Callback fired when processing is successful */
  onSuccess?: (data: T) => void;
  /** Callback fired when processing encounters an error */
  onError?: (error: any) => void;
  /** Callback fired when processing is complete */
  onComplete?: () => void;
  /** Interval in milliseconds between continuous processing batches (default: 5000) */
  continuousInterval?: number;
}

/**
 * State maintained by the batch processor
 */
export interface BatchProcessorState {
  /** Whether a batch is currently being processed */
  isProcessing: boolean;
  /** Whether continuous processing mode is active */
  continuousMode: boolean;
  /** Total number of items processed so far */
  processedCount: number;
  /** ID of the last item processed */
  lastProcessedId: number;
  /** Whether processing is complete (no more items to process) */
  processComplete: boolean;
  /** Default batch size */
  batchSize: number;
  /** Optional limit on the total number of items to process */
  processLimit?: number;
}

/**
 * Custom hook for managing batch processing operations
 * @template T Type of the response from the processing function
 * @param options Configuration options for the batch processor
 * @returns Object containing batch processor state and control functions
 */
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

  // Use refs to avoid circular dependencies in useEffect
  const processingFunctionRef = useRef(processingFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCompleteRef = useRef(onComplete);

  // Update refs when props change
  useEffect(() => {
    processingFunctionRef.current = processingFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCompleteRef.current = onComplete;
  }, [processingFunction, onSuccess, onError, onComplete]);

  /**
   * Set the batch size
   * @param size New batch size
   */
  const setBatchSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, batchSize: size }));
  }, []);

  /**
   * Set the process limit (max number of items to process)
   * @param limit New process limit
   */
  const setProcessLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, processLimit: limit }));
  }, []);

  /**
   * Reset the processor state to start over
   */
  const resetProcessor = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastProcessedId: 0,
      processComplete: false,
      processedCount: 0,
    }));
    toast.info("Processor reset. Will start from the beginning.");
  }, []);

  /**
   * Toggle continuous processing mode
   */
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

  /**
   * Process a single batch
   * @param customOptions Additional options to pass to the processing function
   */
  const processBatch = useCallback(async (customOptions?: Record<string, any>) => {
    if (state.isProcessing || state.processComplete) {
      console.log('[useBatchProcessor] Skipping processBatch - already processing or complete');
      return;
    }

    try {
      console.log('[useBatchProcessor] Starting batch processing');
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const options = {
        batchSize: state.batchSize,
        ...(state.processLimit !== undefined && { limit: state.processLimit }),
        ...(state.lastProcessedId > 0 && { startAfter: state.lastProcessedId }),
        ...customOptions,
      };

      console.log('[useBatchProcessor] Processing with options:', options);
      const result = await processingFunctionRef.current(options);
      console.log('[useBatchProcessor] Processing result:', result);
      
      if (result) {
        // Update state based on result
        setState(prev => ({
          ...prev,
          lastProcessedId: result.lastProcessedId || prev.lastProcessedId,
          processComplete: result.complete || prev.processComplete,
          processedCount: prev.processedCount + (result.processedCount || 0),
        }));

        if (onSuccessRef.current) onSuccessRef.current(result);
        
        if (result.complete) {
          console.log('[useBatchProcessor] Processing complete');
          toast.success("Processing complete! No more items to process.");
          if (onCompleteRef.current) onCompleteRef.current();
          setState(prev => ({ ...prev, continuousMode: false }));
        }
      }
    } catch (err) {
      console.error("[useBatchProcessor] Error processing batch:", err);
      toast.error(`Error occurred while processing batch: ${err.message || 'Unknown error'}`);
      if (onErrorRef.current) onErrorRef.current(err);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isProcessing, state.processComplete, state.batchSize, state.processLimit, state.lastProcessedId]);

  // Effect for continuous mode
  useEffect(() => {
    let intervalId: number | undefined;

    if (state.continuousMode && !state.isProcessing && !state.processComplete) {
      console.log('[useBatchProcessor] Setting up continuous processing interval');
      intervalId = window.setInterval(async () => {
        console.log('[useBatchProcessor] Continuous processing tick');
        await processBatch();
      }, continuousInterval);
    }

    return () => {
      if (intervalId) {
        console.log('[useBatchProcessor] Cleaning up continuous processing interval');
        window.clearInterval(intervalId);
      }
    };
  }, [state.continuousMode, state.isProcessing, state.processComplete, processBatch, continuousInterval]);

  return {
    processBatch,
    setBatchSize,
    setProcessLimit,
    resetProcessor,
    toggleContinuousMode,
    ...state
  };
}

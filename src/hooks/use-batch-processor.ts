
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

  // Use refs for stable references that don't cause re-renders
  const processingFunctionRef = useRef(processingFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCompleteRef = useRef(onComplete);
  const continuousIntervalRef = useRef<number | undefined>();

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
   * Process a single batch
   * @param customOptions Additional options to pass to the processing function
   */
  const processBatch = useCallback(async (customOptions?: Record<string, any>) => {
    setState(prevState => {
      if (prevState.isProcessing || prevState.processComplete) {
        // Already processing or complete — skip
        return prevState;
      }

      // Starting batch processing
      return { ...prevState, isProcessing: true };
    });

    try {
      const currentState = await new Promise<BatchProcessorState>((resolve) => {
        setState(prev => {
          resolve(prev);
          return prev;
        });
      });

      const options = {
        batchSize: currentState.batchSize,
        ...(currentState.processLimit !== undefined && { limit: currentState.processLimit }),
        ...(currentState.lastProcessedId > 0 && { startAfter: currentState.lastProcessedId }),
        ...customOptions,
      };

      const result = await processingFunctionRef.current(options);
      
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
          // Processing complete
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

  // Effect for continuous mode
  useEffect(() => {
    if (state.continuousMode && !state.isProcessing && !state.processComplete) {
      continuousIntervalRef.current = window.setInterval(() => {
        processBatch();
      }, continuousInterval);
    } else {
      if (continuousIntervalRef.current) {
        window.clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = undefined;
      }
    }

    return () => {
      if (continuousIntervalRef.current) {
        window.clearInterval(continuousIntervalRef.current);
      }
    };
  }, [state.continuousMode, state.isProcessing, state.processComplete, continuousInterval, processBatch]);

  return {
    processBatch,
    setBatchSize,
    setProcessLimit,
    resetProcessor,
    toggleContinuousMode,
    ...state
  };
}

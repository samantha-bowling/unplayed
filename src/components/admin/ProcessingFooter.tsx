
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Props for the ProcessingFooter component
 */
interface ProcessingFooterProps {
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Handler for the main process button */
  onProcess: () => void;
  /** Text to display on the process button */
  processText: string;
  /** Text to display while processing is active */
  processingText: string;
  /** Whether the process button should be disabled */
  disabled?: boolean;
  
  /** Whether continuous mode is active */
  continuousMode?: boolean;
  /** Handler to toggle continuous processing */
  onToggleContinuous?: () => void;
  /** Text for enabling continuous processing */
  continuousText?: string;
  /** Text for stopping continuous processing */
  stopContinuousText?: string;
  /** Whether the continuous mode toggle should be disabled */
  continuousDisabled?: boolean;
  
  /** Handler for resetting the processor */
  onReset?: () => void;
  /** Whether the reset button should be disabled */
  resetDisabled?: boolean;
  /** Text for the reset button */
  resetText?: string;
}

/**
 * A reusable footer component for batch processing controls
 * 
 * This component provides a standardized layout for process controls including:
 * - Main process button with loading state
 * - Optional continuous mode toggle
 * - Optional reset button
 */
const ProcessingFooter: React.FC<ProcessingFooterProps> = ({
  isProcessing,
  onProcess,
  processText,
  processingText,
  disabled = false,
  
  continuousMode,
  onToggleContinuous,
  continuousText = "Start Continuous",
  stopContinuousText = "Stop Continuous",
  continuousDisabled = false,
  
  onReset,
  resetDisabled = false,
  resetText = "Reset Processor",
}) => {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <Button 
        onClick={onProcess} 
        disabled={isProcessing || disabled}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {processingText}
          </>
        ) : (
          processText
        )}
      </Button>
      
      {onToggleContinuous && (
        <div className={onReset ? "grid grid-cols-2 gap-2 w-full" : "w-full"}>
          <Button 
            variant={continuousMode ? "destructive" : "outline"}
            onClick={onToggleContinuous}
            disabled={continuousDisabled}
          >
            {continuousMode ? stopContinuousText : continuousText}
          </Button>
          
          {onReset && (
            <Button 
              variant="outline"
              onClick={onReset}
              disabled={resetDisabled}
            >
              {resetText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessingFooter;

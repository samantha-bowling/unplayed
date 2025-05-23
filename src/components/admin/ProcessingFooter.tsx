
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProcessingFooterProps {
  isProcessing: boolean;
  onProcess: () => void;
  processText: string;
  processingText: string;
  disabled?: boolean;
  
  continuousMode?: boolean;
  onToggleContinuous?: () => void;
  continuousText?: string;
  stopContinuousText?: string;
  continuousDisabled?: boolean;
  
  onReset?: () => void;
  resetDisabled?: boolean;
  resetText?: string;
}

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

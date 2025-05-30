
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataQualityIndicatorProps {
  confidence: 'high' | 'medium' | 'low';
  dataQualityPercentage: number;
  gamesWithPrices: number;
  gamesWithoutPrices: number;
  showDetails?: boolean;
}

const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  confidence,
  dataQualityPercentage,
  gamesWithPrices,
  gamesWithoutPrices,
  showDetails = true
}) => {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'text-green-400 border-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-red-400 border-red-400 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const getConfidenceIcon = (conf: string) => {
    switch (conf) {
      case 'high': return <CheckCircle size={14} />;
      case 'medium': return <AlertTriangle size={14} />;
      case 'low': return <XCircle size={14} />;
      default: return <Database size={14} />;
    }
  };

  const getQualityMessage = () => {
    if (dataQualityPercentage >= 95) {
      return "Excellent data quality - pricing is highly accurate";
    } else if (dataQualityPercentage >= 85) {
      return "Good data quality - most games have validated prices";
    } else if (dataQualityPercentage >= 70) {
      return "Fair data quality - some games may have estimated prices";
    } else {
      return "Limited data quality - many games lack pricing information";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 text-xs ${getConfidenceColor(confidence)}`}
              >
                {getConfidenceIcon(confidence)}
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Quality
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getQualityMessage()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Badge variant="outline" className="text-xs">
          {dataQualityPercentage.toFixed(1)}% validated
        </Badge>
      </div>

      {showDetails && (
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Games with prices:</span>
            <span className="text-green-400">{gamesWithPrices.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Games without prices:</span>
            <span className="text-yellow-400">{gamesWithoutPrices.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityIndicator;

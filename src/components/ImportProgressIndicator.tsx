
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SteamLoader } from '@/components/SteamLoader';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface ImportProgressIndicatorProps {
  isImporting: boolean;
  progress: string;
  percentage: number;
  status?: 'preparing' | 'processing' | 'complete' | 'error';
  totalGames?: number;
  helpText?: string;
}

const ImportProgressIndicator: React.FC<ImportProgressIndicatorProps> = ({
  isImporting,
  progress,
  percentage,
  status = 'preparing',
  totalGames,
  helpText
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'complete':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Preparing</Badge>;
    }
  };

  if (!isImporting) return null;

  return (
    <div className="mt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-200">{progress}</span>
        </div>
        {getStatusBadge()}
      </div>
      
      {totalGames && (
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Games found: {totalGames.toLocaleString()}</span>
          <span>{percentage}%</span>
        </div>
      )}
      
      <Progress value={percentage} className="h-2 mb-3" />
      
      {status === 'processing' && (
        <div className="flex items-center justify-center mb-3">
          <SteamLoader message="Processing your library..." size="sm" variant="secondary" />
        </div>
      )}
      
      {helpText && (
        <div className="text-sm bg-unplayed-mint/10 p-3 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-unplayed-mint mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-gray-300">{helpText}</p>
        </div>
      )}
      
      {status === 'processing' && (
        <div className="mt-3 text-xs bg-blue-500/10 p-3 rounded-md">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Zap className="w-3 h-3" />
            <span className="font-medium">Smart Prioritization Active</span>
          </div>
          <p className="text-gray-400">
            Unplayed games are being prioritized for detailed enrichment to improve your dashboard accuracy.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportProgressIndicator;

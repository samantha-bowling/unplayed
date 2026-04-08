
import React from 'react';
import { Library, Compass, Trophy, PackageOpen, BadgeDollarSign, Gamepad2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { DNADimension } from '@/utils/game-dna-utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Library,
  Compass,
  Trophy,
  PackageOpen,
  BadgeDollarSign,
  Gamepad2,
};

interface DNADimensionCardProps {
  dimension: DNADimension;
}

const DNADimensionCard: React.FC<DNADimensionCardProps> = ({ dimension }) => {
  const Icon = iconMap[dimension.icon] || Library;

  return (
    <div className="glass-panel p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-space font-semibold text-foreground text-sm">{dimension.label}</span>
        <span className="ml-auto font-mono text-primary font-bold text-lg">{dimension.score}</span>
      </div>
      <Progress value={dimension.score} className="h-1.5" />
      <p className="text-xs text-muted-foreground italic">{dimension.description}</p>
      <p className="text-xs text-muted-foreground font-mono">{dimension.stat}</p>
    </div>
  );
};

export default DNADimensionCard;

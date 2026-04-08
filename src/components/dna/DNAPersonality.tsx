
import React from 'react';
import { Fingerprint, Sparkles } from 'lucide-react';
import type { DNAProfile } from '@/utils/game-dna-utils';

interface DNAPersonalityProps {
  profile: DNAProfile;
}

const DNAPersonality: React.FC<DNAPersonalityProps> = ({ profile }) => {
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Fingerprint className="h-5 w-5 text-primary" />
        <h3 className="font-space font-bold text-foreground text-lg">Library Personality</h3>
      </div>

      {/* Archetype */}
      <div className="text-center py-4 border border-primary/20 rounded-lg bg-primary/5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Archetype</p>
        <p className="text-2xl font-space font-bold text-primary">{profile.archetype}</p>
        <p className="text-sm text-muted-foreground mt-1 italic">{profile.archetypeDescription}</p>
      </div>

      {/* Surprising stat */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-accent/10 border border-accent/20">
        <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">{profile.surprisingStat}</p>
      </div>
    </div>
  );
};

export default DNAPersonality;

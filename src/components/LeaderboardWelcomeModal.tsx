
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';
import { toast } from 'sonner';
import { Crown, Trophy, Shield, Eye, EyeOff, Users, Sparkles } from 'lucide-react';

interface LeaderboardWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeaderboardWelcomeModal: React.FC<LeaderboardWelcomeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { updateProfile, isUpdating } = useProfile();
  
  const [selectedVisibility, setSelectedVisibility] = useState<'off' | 'anonymous' | 'public'>('anonymous');

  const handleJoin = async () => {
    try {
      await updateProfile({ 
        leaderboard_visibility: selectedVisibility,
        leaderboard_prompt_shown: true
      });
      toast("Welcome to the Dust Dynasty!", {
        description: selectedVisibility === 'off' 
          ? "You can always change your mind in settings." 
          : "Your dust score will appear on the leaderboard shortly.",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save your preference. Please try again.",
      });
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ 
        leaderboard_visibility: 'off',
        leaderboard_prompt_shown: true,
        leaderboard_opted_out_explicitly: true
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save your preference. Please try again.",
      });
    }
  };

  const visibilityOptions = [
    {
      value: 'public',
      icon: Users,
      title: 'Public Champion',
      description: 'Show my Steam name and compete openly',
      badge: 'Most Popular'
    },
    {
      value: 'anonymous',
      icon: Shield,
      title: 'Anonymous Competitor',
      description: 'Compete as "Anonymous Player" for privacy',
      badge: 'Recommended'
    },
    {
      value: 'off',
      icon: EyeOff,
      title: 'Private Observer',
      description: 'Browse the leaderboard without participating',
      badge: null
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Crown className="h-6 w-6 text-unplayed-mint" />
            Welcome to the Dust Dynasty!
            <Trophy className="h-6 w-6 text-unplayed-amber" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-unplayed-mint">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">The Ultimate Gaming Backlog Leaderboard</span>
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-gray-300 max-w-xl mx-auto">
              Compare your gaming backlog with others! The Dust Dynasty ranks players by their most neglected Steam libraries. 
              Higher dust scores mean more unplayed games gathering digital dust.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-unplayed-amber flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              How It Works
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <div>• Dust scores based on game age, ownership time, and play status</div>
              <div>• Real-time rankings updated as you play games</div>
              <div>• Track your progress and rank improvements</div>
              <div>• Celebrate cleaning up your backlog!</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Choose Your Participation Level:</h4>
            <RadioGroup
              value={selectedVisibility}
              onValueChange={(value: 'off' | 'anonymous' | 'public') => setSelectedVisibility(value)}
              className="space-y-3"
            >
              {visibilityOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3 relative">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <IconComponent className="h-4 w-4" />
                        {option.title}
                        {option.badge && (
                          <span className="text-xs bg-unplayed-mint/20 text-unplayed-mint px-2 py-1 rounded-full">
                            {option.badge}
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="flex-1"
              disabled={isUpdating}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleJoin}
              disabled={isUpdating}
              className="flex-1 bg-unplayed-mint hover:bg-unplayed-mint/90 text-black font-semibold"
            >
              {isUpdating ? 'Saving...' : 
               selectedVisibility === 'off' ? 'Browse Privately' : 'Join the Dynasty!'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can change these settings anytime from your leaderboard preferences.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardWelcomeModal;

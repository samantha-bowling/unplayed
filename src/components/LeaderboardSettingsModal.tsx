
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calculator, Shield, Eye, EyeOff, Users } from 'lucide-react';

interface LeaderboardSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeaderboardSettingsModal: React.FC<LeaderboardSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();
  const [selectedVisibility, setSelectedVisibility] = useState(
    profile?.leaderboard_visibility || 'off'
  );

  const handleVisibilityChange = (value: string) => {
    // Type-safe conversion to the specific union type
    if (value === 'off' || value === 'anonymous' || value === 'public') {
      setSelectedVisibility(value);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ leaderboard_visibility: selectedVisibility });
      toast({
        title: "Settings saved",
        description: "Your leaderboard visibility preference has been updated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your settings. Please try again.",
      });
    }
  };

  const visibilityOptions = [
    {
      value: 'off',
      icon: EyeOff,
      title: 'Private',
      description: 'Your scores won\'t appear on the leaderboard'
    },
    {
      value: 'anonymous',
      icon: Shield,
      title: 'Anonymous',
      description: 'Your scores appear as "Anonymous Player"'
    },
    {
      value: 'public',
      icon: Users,
      title: 'Public',
      description: 'Your Steam name appears on the leaderboard'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dust Dynasty Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Leaderboard Visibility</h4>
            <RadioGroup
              value={selectedVisibility}
              onValueChange={handleVisibilityChange}
              className="space-y-3"
            >
              {visibilityOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <IconComponent className="h-4 w-4" />
                        {option.title}
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

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-unplayed-mint" />
              Update Schedule
            </div>
            <p className="text-sm text-gray-400">
              Leaderboards are updated daily at midnight UTC. Changes to your visibility settings take effect immediately.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-unplayed-amber" />
              Dust Score Calculation
            </div>
            <p className="text-sm text-gray-400">
              Your dust score is calculated based on game age, ownership duration, price, quality, and playtime. Unplayed games accumulate more dust over time.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 bg-unplayed-mint hover:bg-unplayed-mint/90 text-black"
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardSettingsModal;

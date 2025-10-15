import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PROFILE_THEMES, DEFAULT_THEME } from '@/lib/profile-themes';
import { PROFILE_BADGES, DEFAULT_BADGES, ProfileBadgeType } from '@/lib/profile-badges';
import { useProfile } from '@/hooks/use-profile';

export function ProfileCustomizationModal() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState(profile?.profile_theme || DEFAULT_THEME);
  const [tagline, setTagline] = useState(profile?.profile_tagline || '');
  const [selectedBadges, setSelectedBadges] = useState<ProfileBadgeType[]>([
    (profile?.profile_badge_1 as ProfileBadgeType) || DEFAULT_BADGES[0],
    (profile?.profile_badge_2 as ProfileBadgeType) || DEFAULT_BADGES[1],
    (profile?.profile_badge_3 as ProfileBadgeType) || 'clean_score',
  ]);

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setSelectedTheme(profile.profile_theme || DEFAULT_THEME);
      setTagline(profile.profile_tagline || '');
      setSelectedBadges([
        (profile.profile_badge_1 as ProfileBadgeType) || DEFAULT_BADGES[0],
        (profile.profile_badge_2 as ProfileBadgeType) || DEFAULT_BADGES[1],
        (profile.profile_badge_3 as ProfileBadgeType) || 'clean_score',
      ]);
    }
  }, [profile]);

  // Persist theme to localStorage
  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem('profile_theme', selectedTheme);
    }
  }, [selectedTheme]);

  const handleBadgeToggle = (badgeId: ProfileBadgeType) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badgeId));
    } else {
      if (selectedBadges.length < 3) {
        setSelectedBadges([...selectedBadges, badgeId]);
      } else {
        toast.error('You can only select 3 stat badges');
      }
    }
  };

  const handleSave = () => {
    if (selectedBadges.length !== 3) {
      toast.error('Please select exactly 3 stat badges');
      return;
    }

    if (tagline.length > 50) {
      toast.error('Tagline must be 50 characters or less');
      return;
    }

    updateProfile(
      {
        profile_theme: selectedTheme,
        profile_tagline: tagline || null,
        profile_badge_1: selectedBadges[0],
        profile_badge_2: selectedBadges[1],
        profile_badge_3: selectedBadges[2],
      },
      {
        onSuccess: () => {
          toast.success('Profile customization saved!');
          setIsOpen(false);
          // Reload to reflect theme changes
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to save customization');
        },
      }
    );
  };

  const taglineLength = tagline.length;
  const taglineOverflow = taglineLength > 50;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Picker */}
          <div className="space-y-3">
            <Label htmlFor="theme-picker">Profile Theme</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PROFILE_THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTheme === theme.id
                      ? 'border-unplayed-mint scale-105'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  aria-label={`Select ${theme.name} theme`}
                  aria-pressed={selectedTheme === theme.id}
                >
                  <div className={`h-12 rounded bg-gradient-to-r ${theme.gradient} mb-2`} />
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                  {selectedTheme === theme.id && (
                    <Check className="absolute top-2 right-2 h-5 w-5 text-unplayed-mint" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tagline Input */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Profile Tagline (Optional)</Label>
            <Input
              id="tagline"
              placeholder="A short message about your gaming style..."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={60}
              className={taglineOverflow ? 'border-destructive' : ''}
              aria-describedby="tagline-help"
            />
            <div 
              id="tagline-help"
              className={`text-xs ${taglineOverflow ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {taglineLength}/50 characters
            </div>
          </div>

          {/* Badge Selector */}
          <div className="space-y-3">
            <div>
              <Label>Stat Badges</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose up to three stats to display alongside your Dust Score ({selectedBadges.length}/3 selected)
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PROFILE_BADGES).map((badge) => {
                const Icon = badge.icon;
                const isSelected = selectedBadges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => handleBadgeToggle(badge.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-unplayed-mint bg-unplayed-mint/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${badge.name}`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{badge.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="absolute top-2 right-2 h-4 w-4 text-unplayed-mint" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <motion.div
              key={selectedTheme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-6 rounded-lg bg-gradient-to-r ${PROFILE_THEMES[selectedTheme].gradient} border border-white/10`}
            >
              <div className="text-white">
                <div className="text-2xl font-bold mb-1">{profile?.steam_name || 'Your Name'}</div>
                {tagline && (
                  <div className="text-white/80 italic text-sm mb-4">"{tagline}"</div>
                )}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {selectedBadges.slice(0, 3).map((badgeId) => (
                    <div key={badgeId} className="bg-white/10 backdrop-blur-sm rounded p-2">
                      <div className="text-xs text-white/70 uppercase">{PROFILE_BADGES[badgeId].name}</div>
                      <div className="text-sm font-bold mt-0.5">Sample</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || selectedBadges.length !== 3}>
              {isUpdating ? 'Saving...' : 'Save Customization'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

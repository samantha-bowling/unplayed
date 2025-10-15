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
import { ANIMATION_PACKS, AnimationPackId } from '@/lib/profile-animation-packs';
import { useProfile } from '@/hooks/use-profile';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function ProfileCustomizationModal() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  
  const [selectedTheme, setSelectedTheme] = useState(profile?.profile_theme || DEFAULT_THEME);
  const [tagline, setTagline] = useState(profile?.profile_tagline || '');
  const [selectedMainStat, setSelectedMainStat] = useState<ProfileBadgeType>(
    (profile?.profile_main_stat || 'dust_score') as ProfileBadgeType
  );
  const [selectedBadges, setSelectedBadges] = useState<ProfileBadgeType[]>(
    [profile?.profile_badge_1, profile?.profile_badge_2, profile?.profile_badge_3]
      .filter(Boolean) as ProfileBadgeType[]
  );
  const [selectedAnimationPack, setSelectedAnimationPack] = useState<AnimationPackId>(
    (profile?.background_animation_pack || 'gaming') as AnimationPackId
  );
  const [mintGlowEnabled, setMintGlowEnabled] = useState(
    profile?.show_mint_glow ?? true
  );

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setSelectedTheme(profile.profile_theme || DEFAULT_THEME);
      setTagline(profile.profile_tagline || '');
      setSelectedMainStat((profile.profile_main_stat || 'dust_score') as ProfileBadgeType);
      setSelectedBadges(
        [profile.profile_badge_1, profile.profile_badge_2, profile.profile_badge_3]
          .filter(Boolean) as ProfileBadgeType[]
      );
      setSelectedAnimationPack((profile.background_animation_pack || 'gaming') as AnimationPackId);
      setMintGlowEnabled(profile.show_mint_glow ?? true);
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
        toast.error('You can only select up to 3 additional stats');
      }
    }
  };

  const handleSave = () => {
    if (tagline.length > 50) {
      toast.error('Tagline must be 50 characters or less');
      return;
    }

    if (!selectedMainStat) {
      toast.error('Please select a main stat');
      return;
    }

    if (selectedBadges.length > 3) {
      toast.error('You can only select up to 3 additional stats');
      return;
    }

    if (selectedBadges.includes(selectedMainStat)) {
      toast.error('Main stat cannot be selected as an additional stat');
      return;
    }

    updateProfile(
      {
        profile_theme: selectedTheme,
        profile_tagline: tagline || null,
        profile_main_stat: selectedMainStat,
        profile_badge_1: selectedBadges[0] || null,
        profile_badge_2: selectedBadges[1] || null,
        profile_badge_3: selectedBadges[2] || null,
        background_animation_pack: selectedAnimationPack,
        show_mint_glow: mintGlowEnabled,
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

          {/* Main Stat Selection */}
          <div className="space-y-3">
            <div>
              <Label>🎯 Featured Stat</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your main stat to display prominently
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PROFILE_BADGES).map((badge) => {
                const Icon = badge.icon;
                const isSelected = selectedMainStat === badge.id;
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedMainStat(badge.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-unplayed-mint bg-unplayed-mint/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    aria-label={`${isSelected ? 'Selected' : 'Select'} ${badge.name} as main stat`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{badge.name}</div>
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

          {/* Additional Stats Selector */}
          <div className="space-y-3">
            <div>
              <Label>📊 Additional Stats (0-3)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose up to three additional stats{selectedBadges.length > 0 && ` (${selectedBadges.length}/3 selected)`}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PROFILE_BADGES)
                .filter((badge) => badge.id !== selectedMainStat) // Exclude main stat
                .map((badge) => {
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

          {/* Background Animation Pack */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">🎬 Background Animations</Label>
            <p className="text-xs text-muted-foreground">Choose animated background theme</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ANIMATION_PACKS).map((pack) => {
                const PackIcon = pack.icon;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedAnimationPack(pack.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      selectedAnimationPack === pack.id
                        ? "border-unplayed-mint bg-unplayed-mint/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                    aria-label={`Select ${pack.name} animation pack`}
                    aria-pressed={selectedAnimationPack === pack.id}
                  >
                    <PackIcon className="h-5 w-5" />
                    <span className="text-xs font-medium">{pack.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mint Glow Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">✨ Mint Glow Effect</Label>
              <p className="text-xs text-muted-foreground">Add a glowing effect to your main stat</p>
            </div>
            <Switch
              checked={mintGlowEnabled}
              onCheckedChange={setMintGlowEnabled}
              aria-label="Toggle mint glow effect"
            />
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative overflow-hidden rounded-lg border-2 border-white/20 p-4 h-48">
              {/* Mini background animations */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                {ANIMATION_PACKS[selectedAnimationPack].icons.slice(0, 5).map((Icon, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${20 + i * 15}%`,
                      animation: 'zen-float-slow 8s ease-in-out infinite alternate',
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    <Icon className="text-white/20" size={16} />
                  </div>
                ))}
              </div>
              
              {/* Preview main stat card */}
              <motion.div
                key={`${selectedTheme}-${mintGlowEnabled}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "relative z-10 p-3 rounded-lg space-y-2",
                  `bg-gradient-to-r ${PROFILE_THEMES[selectedTheme].gradient}`,
                  mintGlowEnabled && "mint-glow"
                )}
              >
                <div className="text-white text-center">
                  <div className="text-xl font-bold mb-1">{profile?.steam_name || 'Your Name'}</div>
                  {tagline && (
                    <div className="text-white/80 italic text-xs">"{tagline}"</div>
                  )}
                </div>
                
                {/* Main Stat Preview */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                  <div className="text-[10px] text-white/70 uppercase mb-1">{PROFILE_BADGES[selectedMainStat].name}</div>
                  <div className="text-lg font-bold text-white">Featured</div>
                </div>

                {/* Additional Stats Preview */}
                {selectedBadges.length > 0 && (
                  <div className={`grid gap-1.5 ${
                    selectedBadges.length === 1 ? 'grid-cols-1 max-w-[60%] mx-auto' :
                    selectedBadges.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {selectedBadges.map((badgeId) => (
                      <div key={badgeId} className="bg-white/10 backdrop-blur-sm rounded p-1.5 text-center">
                        <div className="text-[9px] text-white/70 uppercase">{PROFILE_BADGES[badgeId].name}</div>
                        <div className="text-[10px] font-bold mt-0.5 text-white">Sample</div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || !selectedMainStat}>
              {isUpdating ? 'Saving...' : 'Save Customization'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

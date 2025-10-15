import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { PROFILE_THEMES, DEFAULT_THEME } from '@/lib/profile-themes';
import { PROFILE_BADGES, DEFAULT_BADGES, ProfileBadgeType } from '@/lib/profile-badges';
import { ANIMATION_PACKS, AnimationPackId } from '@/lib/profile-animation-packs';
import { useProfile } from '@/hooks/use-profile';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function ProfileCustomizationModal() {
  const { profile, updateProfile, isUpdating, checkUsernameAvailability } = useProfile();
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

  // Vanity URL states
  const [customUrl, setCustomUrl] = useState(profile?.profile_username || '');
  const [urlAvailable, setUrlAvailable] = useState<boolean | null>(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Cooldown calculation
  const COOLDOWN_DAYS = 30;
  const lastChange = profile?.last_username_change;
  const daysSinceChange = lastChange 
    ? Math.floor((Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const canChangeUrl = !lastChange || (daysSinceChange !== null && daysSinceChange >= COOLDOWN_DAYS);
  const daysRemaining = lastChange && daysSinceChange !== null
    ? Math.max(0, COOLDOWN_DAYS - daysSinceChange) 
    : 0;

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
      setCustomUrl(profile.profile_username || '');
    }
  }, [profile]);

  // Persist theme to localStorage
  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem('profile_theme', selectedTheme);
    }
  }, [selectedTheme]);

  // Debounced availability check
  useEffect(() => {
    if (!customUrl || customUrl === profile?.profile_username) {
      setUrlAvailable(null);
      setUrlError(null);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(customUrl)) {
      setUrlAvailable(false);
      setUrlError('3-20 characters: lowercase letters, numbers, underscores only');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUrl(true);
      try {
        const result = await checkUsernameAvailability(customUrl);
        setUrlAvailable(result.available);
        setUrlError(result.error || null);
      } catch (error) {
        console.error('Failed to check username:', error);
        setUrlError('Failed to check availability');
      } finally {
        setCheckingUrl(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customUrl, profile?.profile_username, checkUsernameAvailability]);

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

    // If URL changed and is available, show confirmation
    if (customUrl !== profile?.profile_username && urlAvailable && canChangeUrl) {
      setShowConfirmDialog(true);
      return;
    }

    // If URL didn't change or not set, save directly
    performSave();
  };

  const handleConfirmedSave = () => {
    setShowConfirmDialog(false);
    performSave();
  };

  const performSave = () => {
    const updates: any = {
      profile_theme: selectedTheme,
      profile_tagline: tagline || null,
      profile_main_stat: selectedMainStat,
      profile_badge_1: selectedBadges[0] || null,
      profile_badge_2: selectedBadges[1] || null,
      profile_badge_3: selectedBadges[2] || null,
      background_animation_pack: selectedAnimationPack,
      show_mint_glow: mintGlowEnabled,
    };

    // Only update username if changed and available
    if (customUrl !== profile?.profile_username && urlAvailable && canChangeUrl) {
      updates.profile_username = customUrl || null;
      updates.last_username_change = new Date().toISOString();
    }

    updateProfile(updates, {
      onSuccess: () => {
        toast.success('Profile customization saved!');
        setIsOpen(false);
        window.location.reload();
      },
      onError: () => {
        toast.error('Failed to save customization');
      },
    });
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

          {/* Custom Vanity URL */}
          <div className="space-y-2 p-4 border border-unplayed-mint/20 rounded-lg bg-unplayed-mint/5">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-url">🔗 Custom Vanity URL (Optional)</Label>
              {!canChangeUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        Changes available in {daysRemaining} days
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You can update this again after the cooldown period</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Set your personal <span className="font-mono text-unplayed-mint">unplayed.wtf</span> link. 
              <span className="text-white/90 font-medium block mt-1">
                ✅ This does NOT change your Steam name or display name.
              </span>
            </p>

            <div className="relative" aria-live="polite">
              <Input
                id="custom-url"
                placeholder="progamer (lowercase only)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value.toLowerCase().trim())}
                disabled={!canChangeUrl}
                className={cn(
                  "font-mono",
                  urlError && "border-destructive",
                  urlAvailable && "border-green-500"
                )}
              />
              {checkingUrl && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin duration-1500 h-4 w-4 border-2 border-unplayed-mint border-t-transparent rounded-full" />
                </div>
              )}
              {!checkingUrl && urlAvailable === true && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {!checkingUrl && urlAvailable === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>

            {urlError && (
              <p className="text-xs text-destructive" role="alert">{urlError}</p>
            )}

            {customUrl && !urlError && urlAvailable && (
              <div className="flex items-center gap-2 text-xs animate-fade-in">
                <span className="text-muted-foreground">Your URL:</span>
                <code className="px-2 py-1 bg-black/20 rounded text-unplayed-mint font-mono">
                  unplayed.wtf/u/{customUrl}
                </code>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              3-20 characters: lowercase letters, numbers, and underscores only
            </p>

            {!canChangeUrl && lastChange && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                <p className="text-yellow-500">
                  Last changed: {new Date(lastChange).toLocaleDateString()}
                </p>
                <p className="text-muted-foreground mt-1">
                  You can change your URL again in {daysRemaining} days (30-day cooldown)
                </p>
              </div>
            )}
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

      {/* URL Change Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm URL Change</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You're about to change your custom vanity URL to:
              </p>
              <div className="p-3 bg-unplayed-mint/10 rounded border border-unplayed-mint/20">
                <code className="text-unplayed-mint font-mono">
                  unplayed.wtf/u/{customUrl}
                </code>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium text-yellow-500">⚠️ Important:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your old URL will stop working immediately</li>
                  <li>You won't be able to change it again for 30 days</li>
                  <li>This does NOT affect your Steam name or display name</li>
                  <li>Shared links will need to be updated</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSave}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

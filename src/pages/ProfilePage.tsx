import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useProfileStats } from '@/hooks/use-profile-stats';
import { UserProfile } from '@/hooks/use-profile';
import { PROFILE_THEMES, DEFAULT_THEME, getDynamicDustTierGradient } from '@/lib/profile-themes';
import { PROFILE_BADGES, ProfileBadgeType } from '@/lib/profile-badges';
import { StatBadge } from '@/components/profile/StatBadge';
import { MainStatCard } from '@/components/profile/MainStatCard';
import { ShareProfile } from '@/components/profile/ShareProfile';
import { ProfileCustomizationModal } from '@/components/profile/ProfileCustomizationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { ProfileBackgroundAnimations } from '@/components/profile/ProfileBackgroundAnimations';
import { AnimationPackId } from '@/lib/profile-animation-packs';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = currentUser?.id === userId;

  // Fetch the user's public profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!userId,
  });

  // Fetch profile stats
  const { data: stats, isLoading: statsLoading } = useProfileStats(userId);

  // Privacy check: Only allow viewing public profiles or own profile
  if (!profileLoading && profile && profile.leaderboard_visibility !== 'public' && !isOwnProfile) {
    return <Navigate to="/" replace />;
  }

  if (profileLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-64 mt-4" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const theme = profile.profile_theme || DEFAULT_THEME;
  let themeConfig = PROFILE_THEMES[theme] || PROFILE_THEMES[DEFAULT_THEME];
  const dustScore = stats?.metrics?.total_dust_score || 0;
  
  // Apply dynamic gradient for Dust Tier theme based on actual dust score
  if (theme === 'dust_tier' && stats?.metrics?.total_dust_score !== undefined) {
    themeConfig = {
      ...themeConfig,
      gradient: getDynamicDustTierGradient(stats.metrics.total_dust_score),
    };
  }
  
  // Get animation settings
  const animationPack = (profile.background_animation_pack || 'gaming') as AnimationPackId;
  const showMintGlow = profile.show_mint_glow ?? true;
  
  // Get main stat from profile
  const mainStatType = ((profile.profile_main_stat || 'dust_score') as ProfileBadgeType);
  const mainStatConfig = PROFILE_BADGES[mainStatType];

  // Helper function to get the appropriate data for each badge type
  const getBadgeData = (badgeType: ProfileBadgeType) => {
    const config = PROFILE_BADGES[badgeType];
    if (badgeType === 'top_genre') {
      return config.format(stats?.genreStats);
    } else if (badgeType === 'top_played_game') {
      return config.format(stats?.topPlayedGame);
    } else if (badgeType === 'dustiest_game') {
      return config.format(stats?.dustiestGame);
    } else if (badgeType === 'leaderboard_rank') {
      return config.format(stats?.leaderboardRank);
    }
    return config.format(stats?.metrics);
  };

  // Get main stat data
  const mainStatData = getBadgeData(mainStatType);

  // Filter additional stats (only non-null badges)
  const additionalStats = [
    profile.profile_badge_1,
    profile.profile_badge_2,
    profile.profile_badge_3,
  ].filter(Boolean) as ProfileBadgeType[];

  // Get additional stat data for SEO/sharing
  const additionalStatsData = additionalStats.map(stat => getBadgeData(stat));

  // Dynamic grid columns based on count
  const getGridColumns = (count: number) => {
    switch (count) {
      case 0: return 'hidden';
      case 1: return 'grid grid-cols-1 max-w-xs mx-auto';
      case 2: return 'grid grid-cols-1 sm:grid-cols-2 max-w-md mx-auto';
      case 3: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      default: return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }
  };

  // Check if user is in top 3
  const isTop3 = stats?.leaderboardRank && stats.leaderboardRank <= 3;
  const crownColor = 
    stats?.leaderboardRank === 1 ? 'text-yellow-400' :
    stats?.leaderboardRank === 2 ? 'text-gray-300' :
    'text-amber-500';

  const profileUrl = `${window.location.origin}/profile/${userId}`;
  const canonicalUrl = `${window.location.origin}/u/${userId}`;

  return (
    <>
      {/* Background animations layer */}
      <ProfileBackgroundAnimations 
        packId={animationPack}
        enabled={!!animationPack}
      />
      
      <Helmet>
        <title>{`${profile.steam_name} on Unplayed`}</title>
        <meta name="description" content={`${profile.profile_tagline || 'Check out my Steam library!'} - ${dustScore.toLocaleString()} Dust Score`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${profile.steam_name} - ${profile.profile_tagline || 'Unplayed Profile'}`} />
        <meta property="og:description" content={`${mainStatData.label}: ${mainStatData.value}${additionalStatsData[0] ? ` | ${additionalStatsData[0].label}: ${additionalStatsData[0].value}` : ''} | ${dustScore.toLocaleString()} total dust`} />
        <meta property="og:image" content={profile.steam_avatar || '/placeholder.svg'} />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:type" content="profile" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${profile.steam_name} on Unplayed`} />
        <meta name="twitter:description" content={`${dustScore.toLocaleString()} Dust Score - ${profile.profile_tagline || 'Unplayed gaming stats'}`} />
        <meta name="twitter:image" content={profile.steam_avatar || '/placeholder.svg'} />
        
        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": profile.steam_name,
            "description": profile.profile_tagline || `${profile.steam_name}'s Unplayed profile`,
            "url": profileUrl,
            "image": profile.steam_avatar,
          })}
        </script>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6 max-w-3xl relative z-10"
      >
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Card className="overflow-hidden">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${themeConfig.gradient} p-6 relative`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-white/20">
                <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
                <AvatarFallback>{profile.steam_name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <h1 className="text-2xl font-bold text-white">{profile.steam_name}</h1>
                  {isTop3 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Crown className={`h-6 w-6 ${crownColor}`} aria-label={`Rank ${stats.leaderboardRank}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ranked #{stats.leaderboardRank} on the leaderboard!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                {profile.profile_tagline && (
                  <p className="text-white/90 italic text-base mb-2">"{profile.profile_tagline}"</p>
                )}
                
                {profile.steam_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    asChild
                  >
                    <a
                      href={`https://steamcommunity.com/profiles/${profile.steam_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Steam Profile
                    </a>
                  </Button>
                )}
              </div>

              {isOwnProfile && (
                <div className="mt-4 md:mt-0">
                  <ProfileCustomizationModal />
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Main Stat Hero Card */}
            <MainStatCard
              badgeType={mainStatType}
              data={mainStatData}
              theme={theme}
              className={cn(showMintGlow && "mint-glow")}
            />

            {/* User-Selected Additional Stats */}
            {additionalStats.length > 0 && (
              <div className={`${getGridColumns(additionalStats.length)} gap-3 justify-items-center`}>
                {additionalStats.map((badgeType) => {
                  const config = PROFILE_BADGES[badgeType];
                  const data = getBadgeData(badgeType);
                  return (
                    <StatBadge
                      key={badgeType}
                      icon={config.icon}
                      label={data.label}
                      value={data.value}
                      subtitle={data.subtitle}
                      theme={theme}
                      dynamicGradient={theme === 'dust_tier' ? themeConfig.gradient : undefined}
                    />
                  );
                })}
              </div>
            )}

            {/* Share Section */}
            <div className="pt-4 border-t">
              <ShareProfile
                username={profile.steam_name || 'Unknown'}
                dustScore={dustScore}
                tagline={profile.profile_tagline}
                badge1Text={`${mainStatData.label}: ${mainStatData.value}`}
                badge2Text={additionalStatsData[0] ? `${additionalStatsData[0].label}: ${additionalStatsData[0].value}` : ''}
                profileUrl={profileUrl}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

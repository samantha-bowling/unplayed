/**
 * Profile badge configuration for user-selectable stats
 * Users can choose 2 badges to display on their profile
 */

import { 
  Gamepad2, 
  Clock, 
  Tag, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Flame, 
  Trophy,
  Library
} from 'lucide-react';

export type ProfileBadgeType = 
  | 'total_games'
  | 'total_playtime'
  | 'top_genre'
  | 'top_played_game'
  | 'dustiest_game'
  | 'dust_score'
  | 'clean_score'
  | 'clean_streak'
  | 'library_value'
  | 'recently_played'
  | 'leaderboard_rank'
  | 'played_games';

export type ProfileBadge = {
  id: ProfileBadgeType;
  name: string;
  icon: any;
  description: string;
  format: (value: any) => { label: string; value: string; subtitle?: string };
};

export const PROFILE_BADGES: Record<ProfileBadgeType, ProfileBadge> = {
  total_games: {
    id: 'total_games',
    name: 'Total Games',
    icon: Gamepad2,
    description: 'Total number of games in your library',
    format: (metrics) => ({
      label: 'Total Games',
      value: metrics?.total_games?.toLocaleString() || '0',
      subtitle: 'In Library',
    }),
  },
  total_playtime: {
    id: 'total_playtime',
    name: 'Total Playtime',
    icon: Clock,
    description: 'Total hours spent playing',
    format: (metrics) => ({
      label: 'Total Playtime',
      value: `${Math.round(metrics?.total_playtime_hours || 0)}h`,
      subtitle: 'Hours Played',
    }),
  },
  top_genre: {
    id: 'top_genre',
    name: 'Top Genre',
    icon: Tag,
    description: 'Your most collected genre',
    format: (genreStats) => {
      const topGenre = genreStats?.[0];
      return {
        label: 'Top Genre',
        value: topGenre?.genre_name || 'None',
        subtitle: topGenre ? `${topGenre.game_count} games` : undefined,
      };
    },
  },
  top_played_game: {
    id: 'top_played_game',
    name: 'Top Played Game',
    icon: TrendingUp,
    description: 'Your most played game by hours',
    format: (topPlayedGame) => {
      const hours = topPlayedGame?.playtime_hours || 0;
      return {
        label: 'Top Played Game',
        value: topPlayedGame?.game_name || 'None',
        subtitle: hours > 0 ? `${Math.round(hours)}h played` : undefined,
      };
    },
  },
  dustiest_game: {
    id: 'dustiest_game',
    name: 'Dustiest Game',
    icon: Sparkles,
    description: 'Your highest Dust Score game',
    format: (dustiestGame) => ({
      label: 'Dustiest Game',
      value: dustiestGame?.game_name || 'None',
      subtitle: dustiestGame ? `${dustiestGame.current_dust_score} Dust` : undefined,
    }),
  },
  dust_score: {
    id: 'dust_score',
    name: 'Dust Score',
    icon: Sparkles,
    description: 'Your total library dust accumulation',
    format: (metrics) => ({
      label: 'Dust Score',
      value: metrics?.total_dust_score?.toLocaleString() || '0',
      subtitle: metrics?.unplayed_games ? `${metrics.unplayed_games} Unplayed` : 'No Dust',
    }),
  },
  clean_score: {
    id: 'clean_score',
    name: 'Clean Score',
    icon: TrendingUp,
    description: 'Your library engagement score',
    format: (metrics) => ({
      label: 'Clean Score',
      value: metrics?.clean_score?.toString() || '0',
      subtitle: metrics?.clean_score_tier || 'Calculating',
    }),
  },
  clean_streak: {
    id: 'clean_streak',
    name: 'Clean Streak',
    icon: Flame,
    description: 'Days since last new game',
    format: (metrics) => ({
      label: 'Clean Streak',
      value: `${metrics?.clean_streak || 0} days`,
      subtitle: 'No New Games',
    }),
  },
  library_value: {
    id: 'library_value',
    name: 'Library Value',
    icon: DollarSign,
    description: 'Total value of your library',
    format: (metrics) => ({
      label: 'Library Value',
      value: `$${((metrics?.total_library_value_cents || 0) / 100).toFixed(0)}`,
      subtitle: 'USD',
    }),
  },
  recently_played: {
    id: 'recently_played',
    name: 'Recently Played',
    icon: Flame,
    description: 'Games played in last 30 days',
    format: (metrics) => ({
      label: 'Recently Played',
      value: metrics?.recently_played_count?.toString() || '0',
      subtitle: 'Last 30 Days',
    }),
  },
  leaderboard_rank: {
    id: 'leaderboard_rank',
    name: 'Leaderboard Rank',
    icon: Trophy,
    description: 'Your current ranking',
    format: (ranking) => ({
      label: 'Leaderboard Rank',
      value: ranking ? `#${ranking}` : 'Unranked',
      subtitle: ranking ? 'Global' : undefined,
    }),
  },
  played_games: {
    id: 'played_games',
    name: 'Played Games',
    icon: Library,
    description: 'Games with playtime',
    format: (metrics) => ({
      label: 'Played Games',
      value: metrics?.played_games?.toLocaleString() || '0',
      subtitle: 'With Playtime',
    }),
  },
};

export const DEFAULT_BADGES: [ProfileBadgeType, ProfileBadgeType] = [
  'total_games',
  'total_playtime',
];

import { PROFILE_BADGES, ProfileBadgeType } from '@/lib/profile-badges';
import { PROFILE_THEMES } from '@/lib/profile-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MainStatCardProps {
  badgeType: ProfileBadgeType;
  data: { label: string; value: string; subtitle?: string };
  theme: string;
  className?: string;
}

export function MainStatCard({ badgeType, data, theme, className }: MainStatCardProps) {
  const config = PROFILE_BADGES[badgeType];
  const Icon = config.icon;
  const themeConfig = PROFILE_THEMES[theme] || PROFILE_THEMES.dust_tier;
  
  return (
    <Card className={cn(`bg-gradient-to-br ${themeConfig.gradient} border-white/10 shadow-lg`, className)}>
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
            {data.label}
          </h2>
        </div>
        <div className="text-4xl font-bold text-white mb-2">
          {data.value}
        </div>
        {data.subtitle && (
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-sm">
            {data.subtitle}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

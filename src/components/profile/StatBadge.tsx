import { PROFILE_THEMES } from '@/lib/profile-themes';

type StatBadgeProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  theme?: string;
};

export function StatBadge({ icon: Icon, label, value, subtitle, theme = 'dust_tier' }: StatBadgeProps) {
  const themeConfig = PROFILE_THEMES[theme] || PROFILE_THEMES.dust_tier;
  const gradient = themeConfig.gradient;

  return (
    <div 
      className={`rounded-lg p-3 bg-gradient-to-r ${gradient} border border-white/10 backdrop-blur-sm transition-transform hover:scale-105 w-full max-w-xs`}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-white/90" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/70 uppercase tracking-wide mb-0.5">
            {label}
          </div>
          <div className="text-xl font-bold text-white truncate">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-white/60 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

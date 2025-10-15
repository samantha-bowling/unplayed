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
      <div className="flex flex-col items-center justify-center text-center gap-2">
        <Icon className="h-5 w-5 text-white/90" aria-hidden="true" />
        <div className="flex flex-col items-center">
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

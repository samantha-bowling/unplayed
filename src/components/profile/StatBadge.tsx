import { PROFILE_THEMES } from '@/lib/profile-themes';

type StatBadgeProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  theme?: string;
  dynamicGradient?: string; // Allow parent to override gradient
};

export function StatBadge({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  theme = 'dust_tier',
  dynamicGradient 
}: StatBadgeProps) {
  const themeConfig = PROFILE_THEMES[theme] || PROFILE_THEMES.dust_tier;
  const gradient = dynamicGradient || themeConfig.gradient; // Use dynamic if provided

  return (
    <div 
      className={`rounded-lg p-4 bg-gradient-to-r ${gradient} border border-white/10 backdrop-blur-sm transition-transform hover:scale-105 w-full max-w-xs`}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Icon className="h-5 w-5 text-white/90" aria-hidden="true" />
        
        <div className="text-xs text-white/70 uppercase tracking-wide">
          {label}
        </div>
        
        <div className="text-2xl font-bold text-white">
          {value}
        </div>
        
        {subtitle && (
          <div className="text-xs text-white/60">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

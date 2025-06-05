
import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GenreHoardingProps extends WithDemoProps {
  onGenreSelect?: (genre: string) => void;
  activeGenre?: string | null;
}

const GenreHoarding = React.memo<GenreHoardingProps>(({
  isDemo = false,
  onGenreSelect,
  activeGenre = null
}: GenreHoardingProps) => {
  const { user } = useAuth();
  const { isDemo: contextIsDemo, demoData } = useDemoMode();
  const { data: dashboardData } = useDashboardData();

  // Use demo mode from context or prop
  const isDemoMode = contextIsDemo || isDemo;

  // Memoize genre data - use demo data when in demo mode, otherwise use dashboard data
  const genreData = useMemo(() => {
    if (isDemoMode) {
      return demoData.genres;
    }
    return dashboardData.genres;
  }, [isDemoMode, demoData.genres, dashboardData.genres]);

  // Memoize most hoarded genre calculation
  const mostHoardedGenre = useMemo(() => {
    if (!genreData.length) {
      return { name: 'None', value: 0, color: '#A3F7BF' };
    }
    return genreData.reduce((prev, current) => 
      prev.value > current.value ? prev : current, 
      { name: 'None', value: 0, color: '#A3F7BF' }
    );
  }, [genreData]);

  // Memoized callback for genre clicks
  const handleGenreClick = useCallback((data: any) => {
    if (onGenreSelect && data && data.name) {
      onGenreSelect(data.name);
    }
  }, [onGenreSelect]);

  // Memoized tooltip formatter
  const tooltipFormatter = useCallback((value: any) => [`${value} games`, 'Count'], []);

  // Memoized legend formatter
  const legendFormatter = useCallback((value: string, entry: any) => {
    const isActive = value === activeGenre;
    return (
      <span style={{ 
        color: isActive ? '#FF6B6B' : 'white', 
        fontWeight: isActive ? 'bold' : 'normal' 
      }}>
        {value}
      </span>
    );
  }, [activeGenre]);

  return (
    <div className={`terminal-container w-full h-full ${isDemoMode ? 'relative' : ''}`}>
      <h3 className="terminal-header text-2xl mb-2">Your Hoarded Genres</h3>
      <TooltipProvider>
        <UITooltip>
          <TooltipTrigger asChild>
            <p className="text-sm text-gray-400 mb-6 cursor-help">
              You say you love <span className="text-unplayed-amber">{mostHoardedGenre.name}</span>... the data agrees
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>Based on your entire collection</p>
          </TooltipContent>
        </UITooltip>
      </TooltipProvider>

      <div className="terminal-content w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={genreData} 
              cx="50%" 
              cy="50%" 
              labelLine={false} 
              outerRadius={80} 
              innerRadius={40} 
              fill="#8884d8" 
              dataKey="value" 
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              onClick={handleGenreClick}
              className="cursor-pointer"
            >
              {genreData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={activeGenre === entry.name ? '#FF6B6B' : entry.color}
                  stroke={activeGenre === entry.name ? '#FFFFFF' : 'none'}
                  strokeWidth={activeGenre === entry.name ? 2 : 0}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                borderColor: '#A3F7BF',
                borderRadius: '8px',
                fontFamily: 'IBM Plex Mono',
                color: 'white',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{color: '#A3F7BF'}}
              labelStyle={{color: 'white'}}
              position={{x: 0, y: 0}}
              offset={10}
              coordinate={{x: 0, y: 0}}
              cursor={{fill: 'transparent'}}
              allowEscapeViewBox={{x: true, y: true}}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{
                fontFamily: 'IBM Plex Mono',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              onClick={handleGenreClick}
              formatter={legendFormatter}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {activeGenre ? (
        <div className="mt-4 text-center p-2 bg-black/30 rounded-lg border border-unplayed-mint/20">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            <p className="text-sm">
              Filtering by <span className="text-unplayed-amber font-medium">{activeGenre}</span>
            </p>
            <button 
              onClick={() => onGenreSelect?.('')} 
              className="text-xs text-unplayed-red hover:underline"
              aria-label="Clear filter"
            >
              Clear filter
            </button>
          </div>
        </div>
      ) : mostHoardedGenre.name !== 'None' && (
        <div className="mt-4 text-center p-2 bg-black/30 rounded-lg border border-unplayed-mint/20">
          <p className="text-sm">
            You hoard <span className="text-unplayed-amber font-medium">{mostHoardedGenre.name}</span> games
            <span className="text-gray-400"> ({mostHoardedGenre.value} games)</span>
          </p>
        </div>
      )}

      {isDemoMode && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <p className="text-sm text-unplayed-mint">
            You're in Demo Mode. Sign in to track your Genre breakdown.
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.isDemo === nextProps.isDemo &&
    prevProps.activeGenre === nextProps.activeGenre &&
    prevProps.onGenreSelect === nextProps.onGenreSelect
  );
});

GenreHoarding.displayName = 'GenreHoarding';

export default withDemoIndicator(GenreHoarding);

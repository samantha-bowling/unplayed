
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPickerNavigation } from '@/utils/navigation';

interface GenreHoardingProps extends WithDemoProps {
  onGenreSelect?: (genre: string) => void;
  activeGenre?: string | null;
}

const GenreHoarding = ({
  isDemo = false,
  onGenreSelect,
  activeGenre = null
}: GenreHoardingProps) => {
  const { user } = useAuth();
  const {
    data: unplayedData
  } = useUnplayedData();
  const navigate = useNavigate();

  const genreData = unplayedData.genres;

  const mostHoardedGenre = genreData.reduce((prev, current) => prev.value > current.value ? prev : current, {
    name: 'None',
    value: 0,
    color: '#A3F7BF'
  });

  const handleGenreClick = (data: any) => {
    if (onGenreSelect && data && data.name) {
      onGenreSelect(data.name);
    }
  };

  const handlePickFromGenre = (genre: string) => {
    navigate('/picker', createPickerNavigation({
      genre,
      source: 'genre',
      shouldAutoSpin: true
    }));
  };

  return (
    <div className={`terminal-container w-full h-full ${isDemo ? 'relative' : ''}`}>
      <h3 className="terminal-header text-2xl mb-2">Your Hoarded Genres</h3>
      <p className="text-sm text-gray-400 mb-6">
        You say you love <span className="text-unplayed-amber">{mostHoardedGenre.name}</span>... the data agrees
      </p>

      <div className="terminal-content w-full h-[250px]">
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
              formatter={(value) => [`${value} games`, 'Count']}
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
              onClick={(data) => handleGenreClick(data)}
              formatter={(value, entry: any) => {
                const isActive = value === activeGenre;
                return (
                  <span style={{ color: isActive ? '#FF6B6B' : 'white', fontWeight: isActive ? 'bold' : 'normal' }}>
                    {value}
                  </span>
                );
              }}
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs px-2 py-1 h-auto"
                onClick={() => handlePickFromGenre(activeGenre)}
              >
                Pick from this genre
              </Button>
              <button 
                onClick={() => onGenreSelect?.('')} 
                className="text-xs text-unplayed-red hover:underline"
                aria-label="Clear filter"
              >
                Clear filter
              </button>
            </div>
          </div>
        </div>
      ) : mostHoardedGenre.name !== 'None' && (
        <div className="mt-4 text-center p-2 bg-black/30 rounded-lg border border-unplayed-mint/20">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <p className="text-sm">
              You hoard <span className="text-unplayed-amber font-medium">{mostHoardedGenre.name}</span> games
              <span className="text-gray-400"> ({mostHoardedGenre.value} games)</span>
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-2 py-1 h-auto"
              onClick={() => handlePickFromGenre(mostHoardedGenre.name)}
            >
              Pick from this genre
            </Button>
          </div>
        </div>
      )}

      {isDemo && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <p className="text-sm text-unplayed-mint">
            You’re in Demo Mode. Sign in to track your Genre breakdown.
          </p>
        </div>
      )}
    </div>
  );
};

export default withDemoIndicator(GenreHoarding);

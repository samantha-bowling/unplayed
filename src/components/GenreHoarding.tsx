
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useUnplayedData from '@/hooks/use-unplayed-data';

interface GenreHoardingProps extends WithDemoProps {
  onGenreSelect?: (genre: string) => void;
  activeGenre?: string | null;
}

const GenreHoarding = ({
  isDemo = false,
  onGenreSelect,
  activeGenre = null
}: GenreHoardingProps) => {
  const {
    signInWithSteam
  } = useAuth();
  const {
    data: unplayedData
  } = useUnplayedData();

  // Use genre data from unplayedData
  const genreData = unplayedData.genres;

  // Find the most hoarded genre
  const mostHoardedGenre = genreData.reduce((prev, current) => prev.value > current.value ? prev : current, {
    name: 'None',
    value: 0,
    color: '#A3F7BF'
  });
  
  // Handle genre click
  const handleGenreClick = (data: any) => {
    if (onGenreSelect && data && data.name) {
      onGenreSelect(data.name);
    }
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
          <p className="text-sm">
            Filtering by <span className="text-unplayed-amber font-medium">{activeGenre}</span>
            <button 
              onClick={() => onGenreSelect?.('')} 
              className="ml-2 text-unplayed-red hover:underline"
              aria-label="Clear filter"
            >
              Clear filter
            </button>
          </p>
        </div>
      ) : mostHoardedGenre.name !== 'None' && (
        <div className="mt-4 text-center p-2 bg-black/30 rounded-lg border border-unplayed-mint/20">
          <p className="text-sm">
            You hoard <span className="text-unplayed-amber font-medium">{mostHoardedGenre.name}</span> games
            <span className="text-gray-400"> ({mostHoardedGenre.value} games)</span>
          </p>
        </div>
      )}
      
      {isDemo && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <button onClick={() => signInWithSteam()} className="text-sm text-unplayed-mint hover:underline">
            Connect to Steam to see your Genre breakdown
          </button>
        </div>
      )}
    </div>
  );
};

export default withDemoIndicator(GenreHoarding);


import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useUnplayedData from '@/hooks/use-unplayed-data';

interface GenreHoardingProps extends WithDemoProps {}

const GenreHoarding = ({ isDemo = false }: GenreHoardingProps) => {
  const { signInWithSteam } = useAuth();
  const { data: unplayedData } = useUnplayedData();
  
  // Use genre data from unplayedData
  const genreData = unplayedData.genres;
  
  // Find the most hoarded genre
  const mostHoardedGenre = genreData.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current, 
    { name: 'None', value: 0, color: '#A3F7BF' }
  );

  return (
    <div className={`terminal-container w-full ${isDemo ? 'relative' : ''}`}>
      <h3 className="terminal-header text-2xl mb-2">Genres You Hoard</h3>
      <p className="text-sm text-gray-400 mb-6">
        You say you love <span className="text-unplayed-amber">{mostHoardedGenre.name}</span>... the data agrees
      </p>
      
      <div className="terminal-content w-full h-[300px]">
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
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {genreData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} games`, 'Count']}
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                borderColor: '#A3F7BF',
                borderRadius: '8px',
                fontFamily: 'IBM Plex Mono'
              }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{
                fontFamily: 'IBM Plex Mono',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {isDemo && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <button 
            onClick={() => signInWithSteam()} 
            className="text-sm text-unplayed-mint hover:underline"
          >
            Connect Steam to see your genre breakdown
          </button>
        </div>
      )}
    </div>
  );
};

export default withDemoIndicator(GenreHoarding);

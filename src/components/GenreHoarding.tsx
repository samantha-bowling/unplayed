
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Sample data - in a real app, this would come from the Steam API
const genreData = [
  { name: 'RPG', value: 32, color: '#A3F7BF' },
  { name: 'Action', value: 23, color: '#EF5DFF' },
  { name: 'Strategy', value: 18, color: '#FFD866' },
  { name: 'Simulation', value: 12, color: '#FF3C38' },
  { name: 'Adventure', value: 10, color: '#61DAFB' },
  { name: 'Other', value: 5, color: '#6C757D' }
];

const GenreHoarding = () => {
  const mostHoardedGenre = genreData.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  );

  return (
    <div className="terminal-container w-full">
      <h3 className="terminal-header text-2xl mb-2">Genres You Hoard</h3>
      <p className="text-sm text-gray-400 mb-6">
        You say you love <span className="text-unplayed-amber">{mostHoardedGenre.name}</span>... the data agrees
      </p>
      
      <div className="w-full h-[300px]">
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
    </div>
  );
};

export default GenreHoarding;

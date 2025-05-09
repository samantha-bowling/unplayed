
import { useState, useEffect } from 'react';

interface DustScoreProps {
  score?: number;
}

const DustScoreMeter = ({ score = 237 }: DustScoreProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const start = 0;
    const end = score;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (end - start) / totalFrames;
    let currentFrame = 0;
    
    const timer = setInterval(() => {
      currentFrame++;
      const currentValue = Math.round(start + increment * currentFrame);
      setAnimatedScore(currentValue);
      
      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);
    
    return () => clearInterval(timer);
  }, [score]);
  
  // Calculate severity level for the score
  const getSeverityColor = () => {
    if (score < 100) return 'text-green-400';
    if (score < 200) return 'text-yellow-400';
    if (score < 500) return 'text-orange-400';
    return 'text-unplayed-red';
  };
  
  const getSeverityText = () => {
    if (score < 100) return 'Minimal Dust';
    if (score < 200) return 'Dusty Collection';
    if (score < 500) return 'Dust Storm Warning';
    return 'Digital Hoarding Detected';
  };

  return (
    <div className="terminal-container w-full">
      <div className="mb-4">
        <h3 className="terminal-header text-2xl mb-2">Dust Score™</h3>
        <p className="text-sm text-gray-400">unplayed time × days since added</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#333"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={score < 100 ? '#A3F7BF' : score < 200 ? '#FFD866' : score < 500 ? '#FF9F39' : '#FF3C38'}
              strokeWidth="8"
              strokeDasharray={`${(animatedScore / 1000) * 283} 283`}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${getSeverityColor()} text-4xl font-bold font-vt`}>
              {animatedScore}
            </span>
            <span className="text-gray-400 text-xs mt-1">DUST UNITS</span>
          </div>
        </div>
        
        <div className="text-center mt-2">
          <p className={`${getSeverityColor()} text-xl font-medium`}>{getSeverityText()}</p>
          <p className="text-sm text-gray-400 mt-2">
            {score < 200 
              ? "Not bad, but there's potential for exploration." 
              : score < 500 
                ? "Your backlog is growing. Time to dive in?" 
                : "Warning: Critical clutter detected in your library."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DustScoreMeter;

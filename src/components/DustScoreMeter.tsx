import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useUnplayedData from '@/hooks/use-unplayed-data';
interface DustScoreProps extends WithDemoProps {
  score?: number;
}
const DustScoreMeter = ({
  score,
  isDemo = false
}: DustScoreProps) => {
  const {
    data: unplayedData
  } = useUnplayedData();
  // Use the provided score or fall back to unplayed data
  const actualScore = score ?? unplayedData.dustScore;
  const [animatedScore, setAnimatedScore] = useState(0);
  const {
    signInWithSteam
  } = useAuth();
  useEffect(() => {
    const duration = 2000;
    const start = 0;
    const end = actualScore;
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
  }, [actualScore]);

  // Calculate severity level for the score
  const getSeverityColor = () => {
    if (actualScore < 100) return 'text-green-400';
    if (actualScore < 200) return 'text-yellow-400';
    if (actualScore < 500) return 'text-orange-400';
    return 'text-unplayed-red';
  };
  const getSeverityText = () => {
    if (actualScore < 100) return 'Minimal Dust';
    if (actualScore < 200) return 'Dusty Collection';
    if (actualScore < 500) return 'Dust Storm Warning';
    return 'Digital Hoarding Detected';
  };
  return <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <div className="mb-4">
        <h3 className="terminal-header text-2xl mb-2">Dust Score™</h3>
        <p className="text-sm text-gray-400">unplayed time × days since added</p>
      </div>
      
      <div className="terminal-content flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={actualScore < 100 ? '#A3F7BF' : actualScore < 200 ? '#FFD866' : actualScore < 500 ? '#FF9F39' : '#FF3C38'} strokeWidth="8" strokeDasharray={`${animatedScore / 1000 * 283} 283`} className="transition-all duration-300" />
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
            {actualScore < 200 ? "Not bad, but there's potential for exploration." : actualScore < 500 ? "Your backlog is growing. Time to dive in?" : "Warning: Critical clutter detected in your library."}
          </p>
        </div>
        
        {isDemo && !document.cookie.includes("demo_note_dismissed") && <div className="mt-auto pt-4 text-center flex justify-center">
            <button onClick={() => signInWithSteam()} className="text-sm text-unplayed-mint hover:underline">Connect to Steam to see your Dust Score</button>
          </div>}
      </div>
    </div>;
};
export default withDemoIndicator(DustScoreMeter);
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AudioPlayerCompact } from './AudioPlayerCompact';

interface FloatingMusicPlayerProps {
  isVisible: boolean;
  onClose: () => void;
}

const PLAYER_WIDTH = 350;
const PLAYER_HEIGHT = 280;

export const FloatingMusicPlayer = ({ isVisible, onClose }: FloatingMusicPlayerProps) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('floatingPlayerPosition');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      x: window.innerWidth - PLAYER_WIDTH - 20,
      y: window.innerHeight - PLAYER_HEIGHT - 20,
    };
  });

  useEffect(() => {
    localStorage.setItem('floatingPlayerPosition', JSON.stringify(position));
  }, [position]);

  if (!isVisible) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{
        top: 0,
        left: 0,
        right: window.innerWidth - PLAYER_WIDTH,
        bottom: window.innerHeight - PLAYER_HEIGHT,
      }}
      onDragEnd={(_, info) => {
        setPosition({ x: info.point.x, y: info.point.y });
      }}
      initial={position}
      style={{
        x: position.x,
        y: position.y,
      }}
      className="fixed z-50 w-[350px] bg-black/95 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-sm"
    >
      {/* Draggable Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 cursor-move bg-black/50">
        <div className="flex items-center gap-2">
          <span className="text-unplayed-mint font-space text-sm">Now Playing</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-unplayed-mint transition-colors"
          aria-label="Close music player"
        >
          <X size={18} />
        </button>
      </div>

      {/* Player Content */}
      <div className="p-4">
        <AudioPlayerCompact />
      </div>
    </motion.div>
  );
};

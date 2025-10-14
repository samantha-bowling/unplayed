import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';

// Playlist configuration
const PLAYLIST = [
  {
    id: 1,
    title: 'A Small Chance',
    artist: "Sam \"Nobody\" Stafford",
    src: '/assets/music/a-small-chance.mp3'
  },
  {
    id: 2,
    title: 'Mission Prep 3',
    artist: "Sam \"Nobody\" Stafford",
    src: '/assets/music/mission-prep-3.mp3'
  }
];

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

interface AudioPlayerState {
  currentTrackIndex: number;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  isExpanded: boolean;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
  frequencyData: Uint8Array;
  errorMessage?: string;
}

type AudioPlayerAction =
  | { type: 'SET_STATUS'; payload: PlayerStatus }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'TOGGLE_EXPANDED' }
  | { type: 'SET_EXPANDED'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_TRACK_INDEX'; payload: number }
  | { type: 'UPDATE_FREQUENCY_DATA'; payload: Uint8Array }
  | { type: 'SET_ERROR'; payload: string };

const initialState: AudioPlayerState = {
  currentTrackIndex: 0,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  isExpanded: false,
  volume: 0.75,
  isMuted: false,
  previousVolume: 0.75,
  frequencyData: new Uint8Array(32),
};

function audioPlayerReducer(state: AudioPlayerState, action: AudioPlayerAction): AudioPlayerState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'TOGGLE_EXPANDED':
      return { ...state, isExpanded: !state.isExpanded };
    case 'SET_EXPANDED':
      return { ...state, isExpanded: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, isMuted: action.payload === 0 };
    case 'TOGGLE_MUTE':
      if (state.isMuted) {
        return { ...state, isMuted: false, volume: state.previousVolume };
      } else {
        return { ...state, isMuted: true, previousVolume: state.volume, volume: 0 };
      }
    case 'SET_TRACK_INDEX':
      return { ...state, currentTrackIndex: action.payload, currentTime: 0 };
    case 'UPDATE_FREQUENCY_DATA':
      return { ...state, frequencyData: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'error', errorMessage: action.payload };
    default:
      return state;
  }
}

interface AudioPlayerContextType extends AudioPlayerState {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  rewind: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleExpanded: () => void;
  currentTrack: typeof PLAYLIST[0];
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioPlayerReducer, {
    ...initialState,
    // Load from localStorage
    volume: parseFloat(localStorage.getItem('audioPlayerVolume') || '0.75'),
    isExpanded: localStorage.getItem('audioPlayerExpanded') === 'true',
    currentTrackIndex: parseInt(localStorage.getItem('audioPlayerTrackIndex') || '0', 10),
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    // Event listeners
    const handleLoadedMetadata = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
      dispatch({ type: 'SET_STATUS', payload: 'ready' });
    };

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
    };

    const handleEnded = () => {
      // Auto-advance to next track
      const nextIndex = (state.currentTrackIndex + 1) % PLAYLIST.length;
      dispatch({ type: 'SET_TRACK_INDEX', payload: nextIndex });
    };

    const handleError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio' });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Load track when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = PLAYLIST[state.currentTrackIndex];
    if (track.src) {
      dispatch({ type: 'SET_STATUS', payload: 'loading' });
      audio.src = track.src;
      audio.load();
    }

    // Save to localStorage
    localStorage.setItem('audioPlayerTrackIndex', state.currentTrackIndex.toString());
  }, [state.currentTrackIndex]);

  // Lazy initialize AudioContext on first play
  const initializeAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // Resume if suspended (Safari fix)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }, []);

  // Frequency data update loop
  useEffect(() => {
    if (state.status !== 'playing' || !state.isExpanded) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    let frameCount = 0;
    const updateFrequencyData = () => {
      frameCount++;
      // Throttle to 20fps (every 3rd frame at 60fps)
      if (frameCount % 3 === 0) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        dispatch({ type: 'UPDATE_FREQUENCY_DATA', payload: dataArray });
      }
      rafRef.current = requestAnimationFrame(updateFrequencyData);
    };

    rafRef.current = requestAnimationFrame(updateFrequencyData);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state.status, state.isExpanded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
    localStorage.setItem('audioPlayerVolume', state.volume.toString());
  }, [state.volume]);

  // Sync expanded state
  useEffect(() => {
    localStorage.setItem('audioPlayerExpanded', state.isExpanded.toString());
  }, [state.isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, state.currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(state.duration, state.currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.currentTime, state.duration, state.volume]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    initializeAudioContext();

    // Resume AudioContext if suspended (Safari)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    audio.play().then(() => {
      dispatch({ type: 'SET_STATUS', payload: 'playing' });
    }).catch((error) => {
      console.error('Playback failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Playback failed' });
    });
  }, [initializeAudioContext]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    dispatch({ type: 'SET_STATUS', payload: 'paused' });
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.status === 'playing') {
      pause();
    } else {
      play();
    }
  }, [state.status, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const skipNext = useCallback(() => {
    const nextIndex = (state.currentTrackIndex + 1) % PLAYLIST.length;
    dispatch({ type: 'SET_TRACK_INDEX', payload: nextIndex });
    if (state.status === 'playing') {
      setTimeout(() => play(), 100);
    }
  }, [state.currentTrackIndex, state.status, play]);

  const skipPrevious = useCallback(() => {
    const prevIndex = state.currentTrackIndex === 0 ? PLAYLIST.length - 1 : state.currentTrackIndex - 1;
    dispatch({ type: 'SET_TRACK_INDEX', payload: prevIndex });
    if (state.status === 'playing') {
      setTimeout(() => play(), 100);
    }
  }, [state.currentTrackIndex, state.status, play]);

  const rewind = useCallback(() => {
    seek(Math.max(0, state.currentTime - 10));
  }, [state.currentTime, seek]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: Math.max(0, Math.min(1, volume)) });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const toggleExpanded = useCallback(() => {
    dispatch({ type: 'TOGGLE_EXPANDED' });
  }, []);

  const contextValue: AudioPlayerContextType = {
    ...state,
    play,
    pause,
    togglePlayPause,
    seek,
    skipNext,
    skipPrevious,
    rewind,
    setVolume,
    toggleMute,
    toggleExpanded,
    currentTrack: PLAYLIST[state.currentTrackIndex],
  };

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};

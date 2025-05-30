
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

type LoadingKey = string;
type LoadingProgress = { [key: string]: number };
type LoadingMessages = { [key: string]: string };

interface LoadingState {
  isLoading: { [key: LoadingKey]: boolean };
  progress: LoadingProgress;
  messages: LoadingMessages;
  errors: { [key: LoadingKey]: string | null };
}

type LoadingAction = 
  | { type: 'START_LOADING'; key: LoadingKey; message?: string }
  | { type: 'STOP_LOADING'; key: LoadingKey }
  | { type: 'SET_PROGRESS'; key: LoadingKey; progress: number; message?: string }
  | { type: 'SET_ERROR'; key: LoadingKey; error: string }
  | { type: 'CLEAR_ERROR'; key: LoadingKey }
  | { type: 'RESET_ALL' };

const initialState: LoadingState = {
  isLoading: {},
  progress: {},
  messages: {},
  errors: {}
};

const loadingReducer = (state: LoadingState, action: LoadingAction): LoadingState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.key]: true },
        messages: { ...state.messages, [action.key]: action.message || 'Loading...' },
        errors: { ...state.errors, [action.key]: null }
      };
      
    case 'STOP_LOADING':
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.key]: false },
        progress: { ...state.progress, [action.key]: 100 }
      };
      
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: { ...state.progress, [action.key]: action.progress },
        messages: action.message ? { ...state.messages, [action.key]: action.message } : state.messages
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.key]: false },
        errors: { ...state.errors, [action.key]: action.error }
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.key]: null }
      };
      
    case 'RESET_ALL':
      return initialState;
      
    default:
      return state;
  }
};

interface LoadingContextType {
  state: LoadingState;
  startLoading: (key: LoadingKey, message?: string) => void;
  stopLoading: (key: LoadingKey) => void;
  setProgress: (key: LoadingKey, progress: number, message?: string) => void;
  setError: (key: LoadingKey, error: string) => void;
  clearError: (key: LoadingKey) => void;
  resetAll: () => void;
  isLoadingAny: (...keys: LoadingKey[]) => boolean;
  getLoadingInfo: (key: LoadingKey) => {
    isLoading: boolean;
    progress?: number;
    message?: string;
    error?: string | null;
  };
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoadingState = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingStateProvider');
  }
  return context;
};

interface LoadingStateProviderProps {
  children: ReactNode;
}

export const LoadingStateProvider: React.FC<LoadingStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  const startLoading = (key: LoadingKey, message?: string) => {
    dispatch({ type: 'START_LOADING', key, message });
  };

  const stopLoading = (key: LoadingKey) => {
    dispatch({ type: 'STOP_LOADING', key });
  };

  const setProgress = (key: LoadingKey, progress: number, message?: string) => {
    dispatch({ type: 'SET_PROGRESS', key, progress, message });
  };

  const setError = (key: LoadingKey, error: string) => {
    dispatch({ type: 'SET_ERROR', key, error });
  };

  const clearError = (key: LoadingKey) => {
    dispatch({ type: 'CLEAR_ERROR', key });
  };

  const resetAll = () => {
    dispatch({ type: 'RESET_ALL' });
  };

  const isLoadingAny = (...keys: LoadingKey[]) => {
    return keys.some(key => state.isLoading[key]);
  };

  const getLoadingInfo = (key: LoadingKey) => ({
    isLoading: state.isLoading[key] || false,
    progress: state.progress[key],
    message: state.messages[key],
    error: state.errors[key]
  });

  const value: LoadingContextType = {
    state,
    startLoading,
    stopLoading,
    setProgress,
    setError,
    clearError,
    resetAll,
    isLoadingAny,
    getLoadingInfo
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingStateProvider;

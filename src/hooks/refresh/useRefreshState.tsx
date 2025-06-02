
import { useState, useCallback } from 'react';

export interface RefreshStates {
  [key: string]: boolean;
}

export const useRefreshState = (operations: string[] = []) => {
  const [refreshStates, setRefreshStates] = useState<RefreshStates>(
    operations.reduce((acc, op) => ({ ...acc, [op]: false }), {})
  );

  // Set loading state for specific operation
  const setOperationLoading = useCallback((operation: string, loading: boolean) => {
    setRefreshStates(prev => ({ ...prev, [operation]: loading }));
  }, []);

  // Check if any operation is loading
  const isAnyOperationLoading = useCallback(() => {
    return Object.values(refreshStates).some(state => state);
  }, [refreshStates]);

  // Check if specific operation is loading
  const isOperationLoading = useCallback((operation: string) => {
    return refreshStates[operation] || false;
  }, [refreshStates]);

  // Reset all loading states
  const resetAllStates = useCallback(() => {
    setRefreshStates(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  }, []);

  return {
    refreshStates,
    setOperationLoading,
    isAnyOperationLoading,
    isOperationLoading,
    resetAllStates,
  };
};

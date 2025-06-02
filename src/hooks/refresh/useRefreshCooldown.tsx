
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useToast } from '@/hooks/use-toast';

export interface CooldownConfig {
  [key: string]: number; // milliseconds
}

interface RefreshTimestamps {
  [key: string]: Date;
}

const DEFAULT_COOLDOWNS: CooldownConfig = {
  import: 2 * 60 * 1000, // 2 minutes
  dashboard: 1 * 60 * 1000, // 1 minute
  prices: 5 * 60 * 1000, // 5 minutes
};

export const useRefreshCooldown = (cooldowns: CooldownConfig = DEFAULT_COOLDOWNS) => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
  const [timestamps, setTimestamps] = useState<RefreshTimestamps>({});

  // Check if operation is allowed based on cooldown
  const canPerformOperation = useCallback((operation: string) => {
    if (isDemo) return false;
    if (!user) return false;

    const lastTimestamp = timestamps[operation];
    if (!lastTimestamp) return true;

    const timeSinceLastOperation = Date.now() - lastTimestamp.getTime();
    const cooldownPeriod = cooldowns[operation];
    return timeSinceLastOperation >= cooldownPeriod;
  }, [timestamps, user, isDemo, cooldowns]);

  // Get remaining cooldown time in seconds
  const getRemainingCooldown = useCallback((operation: string) => {
    const lastTimestamp = timestamps[operation];
    if (!lastTimestamp) return 0;

    const timeSinceLastOperation = Date.now() - lastTimestamp.getTime();
    const cooldownPeriod = cooldowns[operation];
    const remaining = cooldownPeriod - timeSinceLastOperation;
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [timestamps, cooldowns]);

  // Mark operation as performed (updates timestamp)
  const markOperationPerformed = useCallback((operation: string) => {
    setTimestamps(prev => ({ ...prev, [operation]: new Date() }));
  }, []);

  // Show cooldown toast message
  const showCooldownToast = useCallback((operation: string) => {
    const remaining = getRemainingCooldown(operation);
    toast({
      title: `${operation} on cooldown`,
      description: `Please wait ${remaining} seconds before trying again.`,
      variant: "destructive"
    });
  }, [getRemainingCooldown, toast]);

  return {
    canPerformOperation,
    getRemainingCooldown,
    markOperationPerformed,
    showCooldownToast,
    timestamps,
  };
};

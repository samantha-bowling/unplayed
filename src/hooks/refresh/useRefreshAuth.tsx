
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useToast } from '@/hooks/use-toast';

export const useRefreshAuth = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();

  // Check if user can perform refresh operations
  const canPerformRefresh = useCallback(() => {
    if (isDemo) return false;
    if (!user) return false;
    return true;
  }, [user, isDemo]);

  // Show authentication required toast
  const showAuthRequiredToast = useCallback((operation: string) => {
    if (isDemo) {
      toast({
        title: `${operation} not available`,
        description: `${operation} is not available in demo mode.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Authentication required",
        description: `Please log in to ${operation.toLowerCase()}.`,
        variant: "destructive"
      });
    }
  }, [isDemo, toast]);

  // Validate user can perform operation
  const validateUserOperation = useCallback((operation: string) => {
    if (!canPerformRefresh()) {
      showAuthRequiredToast(operation);
      return false;
    }
    return true;
  }, [canPerformRefresh, showAuthRequiredToast]);

  return {
    canPerformRefresh,
    showAuthRequiredToast,
    validateUserOperation,
    user,
    isDemo,
  };
};

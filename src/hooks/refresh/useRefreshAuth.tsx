
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { toast } from 'sonner';

export const useRefreshAuth = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  

  // Check if user can perform refresh operations
  const canPerformRefresh = useCallback(() => {
    if (isDemo) return false;
    if (!user) return false;
    return true;
  }, [user, isDemo]);

  // Show authentication required toast
  const showAuthRequiredToast = useCallback((operation: string) => {
    if (isDemo) {
      toast.error(`${operation} not available`, {
        description: `${operation} is not available in demo mode.`,
      });
    } else {
      toast.error("Authentication required", {
        description: `Please log in to ${operation.toLowerCase()}.`,
      });
    }
  }, [isDemo]);

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

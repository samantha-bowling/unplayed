
// src/context/auth/state-machine.ts
import { AppAuthState } from './types';

// Type guards for state checks
export const isAnonymousState = (state: AppAuthState): boolean => 
  state === 'ANONYMOUS';

export const isAuthenticatedState = (state: AppAuthState): boolean => 
  state === 'AUTHENTICATED';

export const isProfileLoadingState = (state: AppAuthState): boolean => 
  state === 'PROFILE_LOADING';

export const isAuthTransitioningState = (state: AppAuthState): boolean => 
  state === 'AUTH_TRANSITIONING';

export const isOnboardingState = (state: AppAuthState): boolean => 
  state === 'ONBOARDING' || state === 'ONBOARDING_STEAM_LINK';

export const isReadyState = (state: AppAuthState): boolean => 
  state === 'READY';

export const isErrorState = (state: AppAuthState): boolean => 
  state === 'ERROR';

export const isStableState = (state: AppAuthState): boolean =>
  isReadyState(state) || isOnboardingState(state) || isAnonymousState(state);

// Define allowed state transitions
type StateTransition = {
  from: AppAuthState | '*';  // '*' means any state
  to: AppAuthState;
  condition?: () => boolean;
  description: string;
};

// This is a reference table - not directly used in code yet, but useful for documentation and future implementation
export const allowedTransitions: StateTransition[] = [
  { from: 'ANONYMOUS', to: 'AUTH_TRANSITIONING', description: 'User begins authentication process' },
  { from: 'AUTH_TRANSITIONING', to: 'AUTHENTICATED', description: 'User successfully authenticated' },
  { from: 'AUTHENTICATED', to: 'PROFILE_LOADING', description: 'Loading user profile data' },
  { from: 'PROFILE_LOADING', to: 'AUTHENTICATED', description: 'Profile load failed or not found' },
  { from: 'PROFILE_LOADING', to: 'ONBOARDING', description: 'Profile loaded but incomplete' },
  { from: 'PROFILE_LOADING', to: 'READY', description: 'Profile loaded and complete' },
  { from: 'ONBOARDING', to: 'ONBOARDING_STEAM_LINK', description: 'User in Steam linking phase' },
  { from: 'ONBOARDING_STEAM_LINK', to: 'ONBOARDING', description: 'User returned to general onboarding' },
  { from: 'ONBOARDING', to: 'READY', description: 'User completed onboarding' },
  { from: 'ONBOARDING_STEAM_LINK', to: 'READY', description: 'User completed onboarding via Steam link' },
  { from: '*', to: 'ERROR', description: 'Error occurred in any state' },
  { from: '*', to: 'ANONYMOUS', description: 'User signed out or session expired' },
];

// Helper function to determine if a state transition is valid
export function isValidTransition(from: AppAuthState, to: AppAuthState): boolean {
  return allowedTransitions.some(transition => 
    (transition.from === from || transition.from === '*') && 
    transition.to === to &&
    (transition.condition ? transition.condition() : true)
  );
}

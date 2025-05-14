// src/context/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export type Profile = Database['public']['Tables']['users']['Row'];

export enum EnhancedAuthStatus {
  UNAUTHENTICATED = 'unauthenticated',
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  LIBRARY_IMPORTING = 'importing',
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  enhancedStatus: EnhancedAuthStatus;
  isLoading: boolean;
  signInWithProvider: (provider: string, opts?: { redirectTo?: string }) => void;
  signInWithEmail: (email: string) => void;
  signOut: () => void;
  refreshSession: () => Promise<void>;
  refreshProfile: (silent?: boolean) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedAuthStatus>(EnhancedAuthStatus.LOADING);
  const navigate = useNavigate();

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn('[refreshSession] Failed to get session:', error);
    setSession(data.session);
    setUser(data.session?.user ?? null);
  }, []);

  const refreshProfile = useCallback(async (silent = false): Promise<Profile | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .limit(1)
      .single();

    if (error || !data) {
      if (!silent) {
        console.info('[refreshProfile] No profile found — user likely unlinked.');
      }
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }, [user]);

  const signInWithProvider = async (provider: string, opts?: { redirectTo?: string }) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: opts?.redirectTo ?? `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error('Failed to sign in');
      console.error('OAuth Sign In Error:', error.message);
    }
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast.error('Failed to send magic link');
      console.error('Magic Link Error:', error.message);
    } else {
      toast.success('Magic link sent! Check your inbox.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
      console.error('Sign Out Error:', error.message);
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
      setEnhancedStatus(EnhancedAuthStatus.UNAUTHENTICATED);
      navigate('/');
    }
  };

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const isLoading = enhancedStatus === EnhancedAuthStatus.LOADING;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        enhancedStatus,
        isLoading,
        signInWithProvider,
        signInWithEmail,
        signOut,
        refreshSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

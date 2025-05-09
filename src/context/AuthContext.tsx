
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

type UserProfile = {
  id: string;
  steam_id: string;
  steam_name: string;
  steam_avatar: string;
  last_sync: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithSteam: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for access_token and refresh_token in URL params (from Steam auth redirect)
    const handleTokensFromUrl = async () => {
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Remove tokens from URL to prevent sharing sensitive data
            window.history.replaceState({}, document.title, '/');
          }
        } catch (error) {
          console.error('Error setting session:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication.',
            variant: 'destructive',
          });
        }
      }
    };

    handleTokensFromUrl();
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when user is authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        setProfile(data as UserProfile);
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };

    fetchProfile();
  }, [user]);

  // Initialize Steam auth flow
  const signInWithSteam = async () => {
    try {
      const response = await fetch('https://gwmygthanyycveyqqspr.supabase.co/functions/v1/steam-auth/login');
      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to get Steam login URL');
      }
    } catch (error) {
      console.error('Steam auth error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to initialize Steam login.',
        variant: 'destructive',
      });
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signInWithSteam,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


import { useState, useEffect } from 'react';
import { useAuth, AuthStatus, EnhancedAuthStatus } from '@/context/AuthContext';
import { useAuthSessionStatus } from '@/hooks/use-auth-session-status';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { useSteamSession } from '@/hooks/useSteamSession';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import SteamLoader from '@/components/SteamLoader';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import AuthSuccessAnimation from '@/components/AuthSuccessAnimation';
import PrivacyPolicyDialog from '@/components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '@/components/TermsOfServiceDialog';
import SteamLoginButton from '@/components/SteamLoginButton';
import SteamPrivacyChecklist from '@/components/SteamPrivacyChecklist';
import SteamPrivacyError from '@/components/SteamPrivacyError';
import DemoModeFallback from '@/components/DemoModeFallback';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [libraryPrivacyError, setLibraryPrivacyError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const { signInWithSteam, authStatus, user, enhancedStatus: contextEnhancedStatus, profile, refreshProfile, refreshSession } = useAuth();
  const { hasError, retry, enhancedStatus } = useAuthSessionStatus();
  const { toast } = useToast();
  const { setUser: setSteamUser } = useSteamSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || searchParams.get('redirectTo') || '/';

  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const hasAuthSuccess = searchParams.get('auth_success') === 'true';
  const steamId = searchParams.get('steam_id');

  useEffect(() => {
    const establishSession = async () => {
      if (accessToken && refreshToken && !sessionEstablished) {
        console.log('Setting up session from tokens in URL');
        setIsLoading(true);

        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          localStorage.setItem('supabase.access_token', accessToken);
          localStorage.setItem('supabase.refresh_token', refreshToken);

          if (error) {
            console.error('Error setting session:', error);
            toast({ title: 'Authentication Error', description: 'Failed to establish session: ' + error.message, variant: 'destructive' });
          } else if (data.session) {
            if (steamId) {
              const expectedEmail = `steam_${steamId}@unplayed.wtf`;
              const { data: userData, error: userError } = await supabase.auth.getUser();

              if (userError) {
                console.error('Error validating user:', userError);
                toast({ title: 'Authentication Error', description: 'Failed to validate user identity: ' + userError.message, variant: 'destructive' });
                await supabase.auth.signOut();
                setSessionEstablished(false);
                setIsLoading(false);
                return;
              }

              if (userData.user?.email !== expectedEmail) {
                console.error('Session mismatch: Email does not match expected Steam ID format');
                toast({ title: 'Authentication Error', description: 'Session mismatch. Please try again.', variant: 'destructive' });

                if (profile?.steam_id && profile?.steam_name && profile?.steam_avatar) {
                  setSteamUser({
                    steamId: profile.steam_id,
                    personaName: profile.steam_name,
                    avatar: profile.steam_avatar,
                  });
                }

                await supabase.auth.signOut();
                setSessionEstablished(false);
                setIsLoading(false);
                return;
              }

              console.log('Steam ID validation successful');

              console.log("Sending upsert-user payload:", {
                steamId,
                personaName,
                avatar,
                userId,
              });
              
              const res = await fetch("/functions/v1/upsert-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steamId, personaName, avatar, userId }),
              });
              
              const result = await res.json();
              console.log("Upsert-user response:", result);
              
              if (!res.ok) {
                console.error("Upsert-user failed:", res.status, result);
              }

              // ✅ Upsert user into Supabase users table
              const userId = userData.user?.id;
              const personaName = userData.user?.user_metadata?.name || 'Unknown';
              const avatar = userData.user?.user_metadata?.avatar_url || '';

              if (userId && steamId && personaName && avatar) {
                await fetch("/functions/v1/upsert-user", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ steamId, personaName, avatar, userId }),
                }).catch((err) => console.error("Upsert error in AuthPage:", err));
              }
            }

            await refreshSession();

            console.log('Session established successfully:', data.session.user?.id);
            setSessionEstablished(true);

            const cleanUrl = new URL(window.location.href);
            ['access_token', 'refresh_token', 'steam_id', 'user_id', 'auth_success', 'auth_source'].forEach(p => cleanUrl.searchParams.delete(p));
            window.history.replaceState({}, document.title, cleanUrl.toString());

            navigate('/');
            setShowSuccessAnimation(true);
          }
        } catch (error) {
          console.error('Exception during session establishment:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    establishSession();
  }, [accessToken, refreshToken, sessionEstablished, toast, steamId]);

  // ...rest of component unchanged
};

export default AuthPage;

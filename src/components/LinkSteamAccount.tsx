
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import SteamLoginButton from './SteamLoginButton';
import { Button } from './ui/button';
import { useProfile } from '@/hooks/use-profile';

interface LinkSteamAccountProps {
  onSkip?: () => void;
  showSkip?: boolean;
}

export default function LinkSteamAccount({ onSkip, showSkip = false }: LinkSteamAccountProps) {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const [acknowledgedPrivacy, setAcknowledgedPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!user) {
    return null;
  }

  // If the profile already has a Steam ID, don't show the linking UI
  if (profile?.steam_id && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-md space-y-6 mx-auto">
      <h1 className="text-3xl font-bold">Link Your Steam Account</h1>
      <p className="text-muted-foreground text-sm">
        Connect your Steam account to see your personal backlog statistics.
      </p>

      <div className="bg-destructive/10 text-destructive text-sm rounded-md p-4 text-left">
        <p className="font-semibold mb-2">Before you link your Steam account:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Go to <a href="https://steamcommunity.com/my/edit/settings" className="underline">Steam Profile Privacy Settings</a>
          </li>
          <li>Set <strong>Game details</strong> to <code>Public</code></li>
          <li>Uncheck <em>"Always keep my total playtime private"</em></li>
          <li>Save settings and return here to continue</li>
        </ul>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={acknowledgedPrivacy}
          onChange={(e) => setAcknowledgedPrivacy(e.target.checked)}
        />
        I've updated my Steam privacy settings
      </label>

      {error && (
        <div className="bg-red-900/50 border border-red-500 p-4 rounded text-left">
          <p className="font-semibold text-red-400">Error linking Steam account:</p>
          <p className="text-white/80 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-sm text-red-400 hover:text-red-300 mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full">
        <SteamLoginButton fullWidth disabled={!acknowledgedPrivacy} />
        
        {showSkip && (
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}

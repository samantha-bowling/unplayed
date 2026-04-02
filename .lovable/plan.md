
# Remove Discord Server References

## What's changing
Remove all links and mentions of the unplayed.wtf Discord **community server**. Keep Discord as an **authentication provider** (that's Supabase OAuth, unrelated to the server).

## Items to remove

### 1. Footer Discord link
**`src/components/Footer.tsx`** — Remove the Discord link (`discord.gg/YHbr3Ska95`) and the `DiscordIcon` import.

### 2. AboutDialog Discord references
**`src/components/AboutDialog.tsx`** — Remove the "Join our Discord server" link and `DiscordIcon` import. Update the FAQ text to remove the casual Discord mention ("no secret Discord invites").

### 3. Delete DiscordIcon component
**`src/components/icons/DiscordIcon.tsx`** — Delete entirely. After removing Footer and AboutDialog usage, it has zero consumers.

## Items NOT changing (auth provider references)
- `AuthPage.tsx` — "Sign in with Discord" button (OAuth login)
- `AuthModal.tsx` — "Continue with Discord" button (OAuth login)
- `AuthContext.tsx` — Discord OAuth scopes
- `AuthCallbackHandler.tsx`, `AuthErrorHandler.tsx`, `SteamLoginButton.tsx`, `steam-auth/index.ts` — Comments mentioning Discord as an auth method

These are all about Discord OAuth authentication, not the community server.

## Files changed: 3 (2 edited, 1 deleted)

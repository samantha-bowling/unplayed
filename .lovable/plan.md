

# Toast System Consolidation: Migrate to Sonner

## Scope

26 files currently import from `@/hooks/use-toast`. This is larger than the 13 originally estimated. Here's the full breakdown.

## Migration mapping

**Hook-based usage** (`const { toast } = useToast()`) — 18 files:
1. `src/pages/LeaderboardPage.tsx`
2. `src/pages/NotFound.tsx`
3. `src/pages/AuthDebugPage.tsx`
4. `src/pages/LoginErrorPage.tsx`
5. `src/components/AccountDeletionModal.tsx`
6. `src/components/AuthErrorHandler.tsx`
7. `src/components/AuthDebug.tsx`
8. `src/components/LeaderboardSettingsModal.tsx`
9. `src/components/LeaderboardWelcomeModal.tsx`
10. `src/components/SpendingEstimate.tsx`
11. `src/hooks/refresh/useDashboardRefresh.tsx`
12. `src/hooks/refresh/useRefreshAuth.tsx`
13. `src/hooks/refresh/useRefreshCooldown.tsx`
14. `src/hooks/refresh/useLibraryImport.tsx`
15. `src/hooks/refresh/usePriceRefresh.tsx`
16. `src/hooks/useMetricsRefresh.tsx`
17. `src/hooks/useSpendingMetrics.tsx`
18. `src/hooks/useUnifiedSpendingDataV2.tsx`
19. `src/hooks/use-spending-data.tsx`

**Direct `toast()` usage** (no hook) — 7 files:
1. `src/utils/metrics-feedback.ts`
2. `src/components/RandomPicker.tsx`
3. `src/components/SelectedGame.tsx`
4. `src/components/RecentPick.tsx`
5. `src/components/GameReviewCard.tsx`
6. `src/hooks/use-game-picks.tsx`
7. `src/hooks/use-steam-reviews.tsx`

## Changes per file

Each file gets two changes:
1. Replace `import { useToast } from '@/hooks/use-toast'` or `import { toast } from '@/hooks/use-toast'` with `import { toast } from 'sonner'`
2. Remove `const { toast } = useToast()` line (hook-based files only)
3. Update call signatures:
   - `toast({ title, description })` becomes `toast(title, { description })`
   - `toast({ title, description, variant: "destructive" })` becomes `toast.error(title, { description })`
   - `toast({ title, description, duration })` becomes `toast(title, { description, duration })`

## Files to delete
- `src/hooks/use-toast.ts` (the 200-line shadcn hook)
- `src/components/ui/toaster.tsx` (the shadcn Toaster renderer)
- `src/components/ui/use-toast.ts` (re-export file)
- `src/components/ui/toast.tsx` (shadcn toast primitives)

## File to update
- `src/main.tsx` — remove `import { Toaster } from '@/components/ui/toaster'` and remove `<Toaster />` from JSX. Keep `<Sonner />`.

## Risk assessment
- **Low risk**: This is a mechanical find-and-replace migration with no layout or behavioral changes
- **Toast styling**: Sonner inherits the theme from the existing `<Sonner />` component already in `main.tsx`, so styling remains consistent
- **No hook dependency**: Sonner's `toast` is a plain function import, so it works everywhere including utility files like `metrics-feedback.ts` (which currently has to do an awkward non-hook import)


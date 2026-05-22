# Security Hardening Plan — 4 Fixes + 1 Documented Acceptance

Sequential execution. Each finding is verified before moving to the next. **Owner read paths stay byte-identical** — visitor branches are the only behavior change in shared hooks.

---

## Guardrail (applies to Findings 1 & 2)

When updating `use-profile-stats.tsx`, **do not refactor the shared owner path**. The owner (authenticated, viewing self) must continue to read directly from `game_dust_breakdowns` and `user_metrics` exactly as today. Only the visitor branch (viewing someone else's public profile) is rerouted through new RPCs. No consolidation, no "while we're here" cleanup of the owner code path.

---

## Finding 1 — `game_dust_breakdowns` public exposure

**Migration:**
- Drop policy `Allow public read for public profiles` on `game_dust_breakdowns`.
- Create RPC `get_public_dustiest_game(p_user_id uuid)` — SECURITY DEFINER, gated by `is_profile_public(p_user_id)`, returns single top-scoring row: `game_name`, `current_dust_score`, `header_image`.

**Code:** `src/hooks/use-profile-stats.tsx` — visitor branch only: replace direct table query with `supabase.rpc('get_public_dustiest_game', ...)`.

**Verify:** anon `SELECT * FROM game_dust_breakdowns LIMIT 1` returns 0 rows; public profile still shows dustiest game; owner profile unchanged.

---

## Finding 2 — `user_metrics` public exposure (financial fields)

**Migration:**
- Drop policy `Allow public read for public profiles` on `user_metrics`.
- Create RPC `get_public_user_metrics(p_user_id uuid)` — SECURITY DEFINER, gated by `is_profile_public`, returns only: `clean_score`, `clean_score_tier`, `clean_streak`, `total_playtime_hours`, `recently_played_count`, `average_dust_score`, `total_dust_score`. **Excludes** all `*_cents` and all game-count columns.

**Code:**
- `src/hooks/use-profile-stats.tsx` — visitor branch only: call new RPC, return safe defaults (null/0) for excluded fields.
- `src/pages/ProfilePage.tsx` — audit and hide any financial UI or game-count UI when viewing as non-owner.

**Verify:** anon read of `user_metrics` blocked; public profile shows scores + playtime, no $ or counts; owner profile unchanged.

---

## Finding 3 — `leaderboard_snapshots` financial + count leakage

**Code:** `supabase/functions/calculate-leaderboard-rankings/index.ts`
- When building snapshot rows: set `library_value_cents = null` unless the user has `show_library_value_on_leaderboard = true`.
- Always set `total_games`, `unplayed_games`, `played_games` to `null` (or `0` if not nullable — confirm schema before migration).
- Add comment noting opt-in preference governs financial inclusion.

**Migration (one-time scrub):** `UPDATE leaderboard_snapshots SET library_value_cents = NULL WHERE user_id NOT IN (SELECT id FROM users WHERE show_library_value_on_leaderboard = true)`; null out game counts globally.

**Verify:** anon read confirms financial/count fields null for non-opted-in users; leaderboard UI unchanged (counts already hidden per Leaderboard Normalization memory).

---

## Finding 4 — `games` table INSERT policy

**Migration:** `DROP POLICY "Authenticated users can insert games" ON public.games;`

**Code:** none. Edge functions use service role and bypass RLS.

**Verify:** linter clears finding; sync edge functions still insert successfully.

---

## Finding 5 — `v_public_profiles` SECURITY DEFINER (DESCOPED)

**Decision:** Accept the linter finding. Do not drop or replace the view.

**Action:**
- Mark finding as ignored in Supabase dashboard with rationale.
- Update `@security-memory` to document:
  > `v_public_profiles` is intentionally SECURITY DEFINER. The view exposes only pre-approved public columns (`id`, `steam_name`, `steam_avatar`, `profile_*`) and is the correct pattern for bypassing owner-only RLS on the `users` table for public profile reads. Linter warning acknowledged and accepted.

**No code changes.** `ProfilePage.tsx` and `use-realtime-leaderboard.tsx` are not touched.

---

## End-of-pass validation

1. Anonymous `read_query` against `game_dust_breakdowns`, `user_metrics`, `leaderboard_snapshots` — confirm financial/per-game fields inaccessible.
2. Logged-out view of a public profile — renders correctly via new RPCs.
3. Owner view of own profile — byte-identical to today.
4. Re-run Supabase linter — confirm Findings 1–4 cleared; Finding 5 remains as accepted/documented.

## Files touched

- 4 migrations (Findings 1, 2, 3-scrub, 4)
- `supabase/functions/calculate-leaderboard-rankings/index.ts`
- `src/hooks/use-profile-stats.tsx` (visitor branch only)
- `src/pages/ProfilePage.tsx` (visitor-mode UI hiding)
- Security memory update (Finding 5 rationale + general posture)

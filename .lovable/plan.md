

## Bug: `get_clean_game_price()` Broken — Returns NULL for All Games With Price Data

### Root Cause

The `get_clean_game_price()` database function has a critical variable type mismatch. It declares `price_data` as `jsonb`, then does:

```sql
SELECT gp.final_price_cents, gp.initial_price_cents, gp.currency, gp.last_checked
INTO price_data
FROM public.game_prices gp ...
```

In PL/pgSQL, `SELECT col1, col2, col3, col4 INTO single_variable` assigns only the **first column** to that variable. So `price_data` receives an integer (e.g. `2499`), auto-cast to jsonb as a bare number `2499` — **not** a jsonb object.

Then `price_data->>'final_price_cents'` tries to extract a key from a jsonb number, which returns `NULL`. So:
- `final_price` = NULL
- The function falls through to `IF final_price IS NULL THEN confidence := 'low'`

**Result**: Every game that HAS a `game_prices` row gets `NULL` price and `low` confidence. Games WITHOUT a `game_prices` row correctly fall back to `games.price_cents` at `medium` confidence. This is backwards — the more price data we have, the worse the results.

### Your Numbers Explained

- 83 total games
- 60 have `game_prices` rows with valid prices → all return NULL/low (broken)
- ~11 have no `game_prices` row but have `games.price_cents` → return valid price/medium (working)
- ~12 have neither → truly unknown

So only 11 out of 83 games contribute to your $240.89 total. The real total should be significantly higher.

### Fix: One Database Migration

Replace the `get_clean_game_price()` function to use individual typed variables instead of a single jsonb variable for the SELECT INTO.

**File: New SQL migration**

```sql
CREATE OR REPLACE FUNCTION public.get_clean_game_price(...)
```

Key change: declare four separate variables (`v_final_price_cents`, `v_initial_price_cents`, `v_currency`, `v_last_checked`) and SELECT INTO them individually. Then reference them directly instead of trying to extract from jsonb.

### After Deploying

Once the function is fixed, re-running `upsert_user_spending_metrics` for your user will produce correct totals because the same `get_clean_game_price()` is called by all spending RPCs. No other code changes needed — the bug is entirely in this one database function.

### Impact

| Area | Effect |
|------|--------|
| Spending page (SpendingSummary) | Correct totals, free game count, confidence score |
| Dashboard (useUserMetrics) | `total_library_value_cents` and `unplayed_value_cents` fixed |
| Leaderboard (library value column) | Correct values |
| All other users | Fixed on next metrics recalculation |
| Edge functions | No changes needed |
| UI code | No changes needed |

### Files Modified

| File | Change |
|------|--------|
| New migration SQL | Replace `get_clean_game_price()` with properly typed variables |


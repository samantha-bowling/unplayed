

## Fix Spending Data Accuracy Across Dashboard & Spending Pages

### Problem Confirmed

The `upsert_user_spending_metrics` DB function uses **raw, unvalidated prices** from the `games` table as a fallback, while `calculate_user_metrics_with_clean_score` uses `get_clean_game_price()` which caps prices at $500 and rejects bad data. This creates massive discrepancies:

| User | `user_spending_metrics` (total) | `user_metrics` (total) | Ratio |
|------|------|------|------|
| User A | $1,059,778 | $10,397 | 102x |
| User B | $1,036,832 | $25,161 | 41x |
| User C | $838,301 | $5,646 | 148x |

**Root cause:** 68 games in the `games` table have corrupt `price_cents` (e.g., F1® 25 = $999,000, Sekiro = $891,000). The `game_prices` table is clean, but when `upsert_user_spending_metrics` falls back to `g.price_cents`, it uses the corrupt values directly.

### Affected Components

| Component | Data Source | Status |
|-----------|-----------|--------|
| Dashboard "unplayed Value" card (`SpendingEstimate`) | `useUnifiedSpendingDataV2` → `user_spending_metrics` | **Inflated** |
| Spending page Overview tab (`SpendingSummary`) | same | **Inflated** |
| Spending page Insights tab (`SpendingInsights`) | same (for savings, library composition counts) | **Inflated totals** |
| Top Expensive Unplayed Games | `useTopExpensiveUnplayedGames` → `game_prices` directly | **OK** (game_prices is clean) |
| Genre bar chart in Insights | `useGenreStats` → `user_genre_stats` (counts only) | **OK** (no price data) |
| `useDashboardData` | reads from `user_spending_metrics` | **Inflated** |

### Plan

**Step 1: Fix `upsert_user_spending_metrics` RPC (migration)**

Replace the raw `COALESCE(gp.final_price_cents, g.price_cents)` with `get_clean_game_price(ug.game_id, g.price_cents)` — the same validated price function used by `calculate_user_metrics_with_clean_score`. This ensures all prices are capped at $500 and negative/null values are handled.

The full function will be rewritten to mirror the approach in `calculate_user_spending_metrics` (which already uses `get_clean_game_price` correctly) but retaining the upsert behavior.

**Step 2: Clean corrupt `games.price_cents` data (migration)**

```sql
UPDATE games SET price_cents = NULL WHERE price_cents > 50000;
```

This clears the 68 corrupt records so even functions that don't use `get_clean_game_price` won't be affected in the future.

**Step 3: No frontend changes needed**

All frontend components (`SpendingEstimate`, `SpendingSummary`, `SpendingInsights`, `useDashboardData`) already read from `user_spending_metrics` via `useUnifiedSpendingDataV2`. Once the DB function is fixed:
- A "Refresh Dashboard" click triggers `upsert_user_spending_metrics` which will now produce correct values
- All pages will immediately show accurate data

`TopExpensiveUnplayedGames` reads directly from the clean `game_prices` table, so it is already correct.

### Technical Details

| File | Change |
|------|--------|
| New migration | Rewrite `upsert_user_spending_metrics` to use `get_clean_game_price`; NULL out corrupt `games.price_cents > 50000` |
| No frontend changes | All UI reads from `user_spending_metrics` which will be fixed at the DB level |
| No edge function changes | `calculate-user-spending` calls `upsert_user_spending_metrics` — it will automatically benefit |

### Impact

- Dashboard and Spending page values will drop from inflated thousands/millions to accurate amounts
- `user_spending_metrics` and `user_metrics` will be consistent with each other
- Existing users will see corrected values after their next "Refresh Dashboard" click
- No risk to other pages — this is purely a DB function fix and data cleanup


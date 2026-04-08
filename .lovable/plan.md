

## Move Dust Score Tiers Below User's Dust Tier

Currently in the right column of `DustScoreBreakdown.tsx`, the order is:
1. Your Dust Tier
2. Dust Reduction Progress
3. Biggest Opportunity
4. Oldest Neglected
5. Dust Score Tiers

The change moves "Dust Score Tiers" to position 2, directly under "Your Dust Tier", so the user sees their ranking and the full tier reference together.

### File: `src/components/dust/DustScoreBreakdown.tsx`

In the right column `<div>` (line 316), reorder the blocks:
1. Your Dust Tier (lines 318-329) -- stays
2. **Dust Score Tiers** (lines 377-399) -- moved up
3. Dust Reduction Progress (lines 332-354) -- shifted down
4. Biggest Opportunity (lines 357-364) -- stays
5. Oldest Neglected (lines 367-374) -- stays

No logic or styling changes needed -- just cut/paste the Dust Score Tiers block.


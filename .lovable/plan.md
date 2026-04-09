

## Remove Support/Donation Page and Stripe Integration

### Summary
Remove the `/support` page, `/admin/support` page, all donor-related components, Stripe webhook edge function, donor tier calculation edge function, and all navigation links pointing to them.

### Files to Delete
| File | Reason |
|------|--------|
| `src/pages/SupportPage.tsx` | The support/donation page |
| `src/pages/AdminSupportPage.tsx` | Admin support page |
| `src/components/HallOfThanks.tsx` | Donor hall of thanks component |
| `src/components/DonorGrid.tsx` | Donor grid display |
| `src/components/DonorCard.tsx` | Individual donor card |
| `supabase/functions/handle-stripe-donation/index.ts` | Stripe webhook handler |
| `supabase/functions/calculate-donor-tiers/index.ts` | Donor tier calculation |

### Files to Modify

**`src/App.tsx`**
- Remove `SupportPage` and `AdminSupportPage` lazy imports
- Remove `/support` route
- Remove `/admin/support` route

**`src/components/Footer.tsx`**
- Remove the `handleSupportersClick` callback
- Remove the "Supporters" button from the footer links

**`src/components/header/MobileMenu.tsx`**
- Remove the "Admin Support" nav link

**`src/pages/AdminDashboardPage.tsx`**
- Remove the "Admin Support" card from the admin dashboard grid

### Notes
- The `donors` table in Supabase will remain untouched (no data deletion) -- you can drop it manually later if desired
- No navigation links in `NavigationLinks.tsx` reference `/support`, so no change needed there
- Stripe secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) can be removed from Supabase edge function secrets manually via the dashboard if desired


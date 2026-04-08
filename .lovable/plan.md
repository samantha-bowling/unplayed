

## Plan: Admin Panel Consistency & Cleanup

### Issues Found

1. **AdminSteamDataPage** is a 486-line legacy page that duplicates functionality now in QueueManagerPage (queue stats, batch processing, metadata consistency). It's still routed at `/admin/data-manager` but is essentially dead weight.

2. **AdminDataManagerPage** is a slimmer duplicate -- it only has the Metadata Consistency card, which already exists in QueueManagerPage's Section 3.

3. **AuthDebugPage** doesn't use `AdminLayout` -- it's a bare `<div>` with no consistent wrapper, header spacing, or max-width constraint.

4. **AdminDashboardPage** has empty placeholder content (`h-16` div) inside each tool card, and the "Quick Utilities" section with DatabaseCleanupCard sits awkwardly alone in a half-width grid.

5. **AdminSupportPage** renders the full public SupportPage then tacks admin tools below it -- inconsistent with the dedicated admin layout pattern.

6. **AdminDashboardPage** links to `/auth-debug` which is outside the `/admin/*` namespace -- inconsistent URL structure.

7. No back-navigation or breadcrumbs between admin pages.

### Proposed Changes

**1. Remove dead pages: AdminSteamDataPage + AdminDataManagerPage**
- Delete `src/pages/AdminSteamDataPage.tsx` and `src/pages/AdminDataManagerPage.tsx`
- Remove their routes and redirects from `App.tsx`
- Redirect `/admin/data-manager` to `/admin/queue-manager` (all tools live there now)

**2. Wrap AuthDebugPage in AdminLayout**
- Add `AdminLayout` wrapper for consistent spacing, max-width, and header
- Move route from `/auth-debug` to `/admin/auth-debug`
- Update AdminDashboardPage link accordingly

**3. Clean up AdminDashboardPage**
- Remove empty placeholder `h-16` divs from tool cards
- Add live stat badges to each card (e.g., queue pending count for Queue Manager, deletion count for Account Deletions) using lightweight queries
- Move DatabaseCleanupCard into a collapsible "Quick Utilities" section using `CollapsibleToolCard` pattern from QueueManagerPage
- Add a "Data Manager" card pointing to `/admin/queue-manager` (or remove if redundant with Queue Manager card)

**4. Add breadcrumb navigation to admin pages**
- Simple "Admin Dashboard > Page Name" text breadcrumb at the top of each admin sub-page
- Links back to `/admin/dashboard`

**5. AdminSupportPage consistency**
- Wrap the admin tools section in `AdminLayout` styling (gradient card with proper spacing) instead of the current overlay approach
- No structural change needed -- just visual alignment with the terminal aesthetic

### Files Modified

| File | Change |
|------|--------|
| `src/pages/AdminSteamDataPage.tsx` | Delete |
| `src/pages/AdminDataManagerPage.tsx` | Delete |
| `src/App.tsx` | Remove dead routes, move `/auth-debug` to `/admin/auth-debug`, redirect `/admin/data-manager` to `/admin/queue-manager` |
| `src/pages/AuthDebugPage.tsx` | Wrap in `AdminLayout` |
| `src/pages/AdminDashboardPage.tsx` | Remove placeholder divs, add breadcrumb, update auth-debug path, make Quick Utilities collapsible |
| `src/pages/AdminAccountDeletionsPage.tsx` | Add breadcrumb back to dashboard |
| `src/pages/QueueManagerPage.tsx` | Add breadcrumb back to dashboard |
| `src/pages/AdminSupportPage.tsx` | Add breadcrumb, align admin tools section styling |

### Technical Notes
- Breadcrumb is a simple inline component (no new file needed) -- just a `Link` + separator + page title
- Live stat badges on dashboard cards use `useQuery` with stale time to avoid hammering the DB on every visit
- All changes are cosmetic/structural -- no backend or edge function changes


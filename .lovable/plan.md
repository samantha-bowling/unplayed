

# Mobile Experience Deep Dive: Issues & Improvements

## Issues Found

### 1. Picker: Game Title & "Play Now" Button Overlap (Critical)
In `SelectedGame.tsx`, the mobile layout uses `flex items-start justify-between` (line 84) which places the game title and Play Now button side-by-side. On narrow screens, long game names like "The Witcher 3: Wild Hunt" wrap and collide with the button (visible in screenshot). The button should stack below the title on mobile.

**Fix:** On mobile, stack the title area and Play Now button vertically. Move Play Now below the game name/genres block on small screens.

### 2. Picker: "Prevent Duplicates" Checkbox Disappears After Pick
The checkbox (line 219) has `!currentSessionPick &&` condition — once a game is picked, the option vanishes. Users can't change this preference without resetting. Minor but inconsistent.

### 3. Genre Chart Labels Clipped on Mobile
The pie chart in `GenreHoarding.tsx` uses `label={({name, percent}) => ...}` which renders text labels that overflow the container on 375px screens. Labels like "Adventure 20%" and "Casual" are cut off at the edges. The chart `outerRadius={80}` is too large for mobile.

**Fix:** Reduce `outerRadius` on mobile or disable inline labels and rely on the legend + tooltip instead.

### 4. Dashboard Cards: Excessive Vertical Space
The `unplayed Value` card has a large empty area below "Show me the damage" button. The `equal-height-container` CSS forces all 3 dashboard cards to the same height, but on mobile they stack vertically — so equal height just creates empty space in shorter cards.

**Fix:** Only apply `grid-auto-rows: 1fr` on `md:` screens. On mobile, let cards be natural height.

### 5. Mobile Menu Doesn't Close on Navigation
`MobileMenu.tsx` `NavLink` component doesn't call `onToggle` to close the menu when a link is clicked. The menu stays open after navigation.

**Fix:** Pass `onToggle` (or a close callback) to `NavLink` and call it on click.

### 6. Shelf Life Section: Game Items Cramped
The shelf life game items show image + name + release date + age all in a single row. On mobile this gets very tight. The text "10y 10m" and release dates overlap with game names.

### 7. Library Preview: Pagination Numbers Too Small
The pagination buttons use `w-8 h-8 p-0` (line 303) which is 32px — below the recommended 44px minimum touch target for mobile.

**Fix:** Increase to `w-10 h-10` on mobile.

### 8. RecentPick: Same Title/Button Overlap as SelectedGame
`RecentPick.tsx` has the same `flex items-start justify-between` layout (line 84) causing the "Play Now" button to overlap with the game name on mobile. Same fix needed.

### 9. Footer Links: Vertical Spacing Too Tight
Footer links stack vertically on mobile with `space-y-2` (8px gap). Touch targets are just text links with no padding — easy to mis-tap.

**Fix:** Add `py-1` to footer links for larger touch targets on mobile.

### 10. Demo vs Auth Consistency
Both experiences share the same components, so the layout issues affect both equally. The demo mode banner and auth CTA sections look fine on mobile. No inconsistencies between demo and auth mobile layouts beyond the shared component issues above.

---

## Proposed Plan

### Phase 1: Picker Mobile Layout (highest impact)
1. **SelectedGame.tsx** — On mobile, stack the title/genres and Play Now button vertically instead of side-by-side. Add `flex-col sm:flex-row` to the title+button row.
2. **RecentPick.tsx** — Same fix as SelectedGame for consistency.

### Phase 2: Dashboard Cards & Charts
3. **index.css** — Change `.dashboard-grid` to only apply `grid-auto-rows: 1fr` at `md:` breakpoint so mobile cards have natural height.
4. **GenreHoarding.tsx** — Disable inline pie chart labels on mobile (use `useIsMobile()` to conditionally set `label={false}`), reduce `outerRadius` to 60 on mobile.

### Phase 3: Navigation & Touch Targets
5. **MobileMenu.tsx** — Pass close callback to `NavLink`, call it on click so menu dismisses on navigation.
6. **Footer.tsx** — Add `py-2` padding to mobile footer links for better touch targets.
7. **LibraryPreview.tsx** — Increase pagination button size on mobile.

### Phase 4: Minor Polish
8. **GameSpinner.tsx** — The decorative "selecting...", "filtering...", "calculating..." text (lines 28-30) uses absolute positioning that can overflow on small screens. Hide on mobile or constrain.


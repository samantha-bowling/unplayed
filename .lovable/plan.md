

## Profile Enhancements Plan

Four targeted improvements to the profile experience, all UI-only changes with no database modifications.

### 1. Add "No Animations" option
**`src/lib/profile-animation-packs.ts`**
- Add a `'none'` entry to `AnimationPackId` type and `ANIMATION_PACKS` record with an empty `icons` array, `count: 0`, and a descriptive label like "None — No background animations"

**`src/components/profile/ProfileBackgroundAnimations.tsx`**
- Early-return when `packId === 'none'` or when the pack has no icons

**`src/components/profile/ProfileCustomizationModal.tsx`**
- The "None" pack will automatically appear in the animation picker grid since it iterates `Object.values(ANIMATION_PACKS)`
- Preview section: handle empty icons array gracefully (already guarded by `.slice(0, 5)`)

### 2. Remove full page reload on save
**`src/components/profile/ProfileCustomizationModal.tsx`**
- In `handleSave` → `onSuccess`: remove `window.location.reload()`
- Instead, close the modal (`setIsOpen(false)`) and let React Query's cache invalidation (already happening in `useProfile.updateProfile.onSuccess`) reactively update the profile page
- The `ProfilePage` already reads from the query cache, so the theme/animation changes will apply automatically

### 3. Fix tagline character limit mismatch
**`src/components/profile/ProfileCustomizationModal.tsx`**
- Change the `<Input maxLength={60}>` to `maxLength={50}` to match the validation logic and the displayed counter ("X/50 characters")

### 4. Better private profile UX
**`src/pages/ProfilePage.tsx`**
- Replace the silent `<Navigate to="/" replace />` for private profiles with an informative card:
  - Icon (Lock), heading "This profile is private", description "This user has chosen to keep their profile private."
  - A "Back to Home" button for navigation
- Keep the redirect behavior for unauthenticated users who land on private profiles, but show the message for authenticated visitors

### Files touched
| File | Change |
|------|--------|
| `src/lib/profile-animation-packs.ts` | Add `'none'` animation pack |
| `src/components/profile/ProfileBackgroundAnimations.tsx` | Guard for `'none'` pack |
| `src/components/profile/ProfileCustomizationModal.tsx` | Remove reload, fix maxLength |
| `src/pages/ProfilePage.tsx` | Private profile message UI |


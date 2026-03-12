

## Issues Found

### 1. Analyzing Page: Avatar shows placeholder instead of real profile pic
**Line 85** in `AnalyzingProfile.tsx` uses `ui-avatars.com` placeholder. The real avatar isn't available yet because `trigger-scan` hasn't run at this point — the profile was just created. However, the `tracked_profiles` record already exists (created in `AddProfile.tsx` via insert). We can pass the avatar URL from the profile data or fetch it from the DB.

**Fix**: Query `tracked_profiles` by `profileId` to get the `avatar_url` (which gets populated by `trigger-scan`). Since the scan hasn't run yet at page load, and the avatar comes from the scan, the best approach is to use `InstagramAvatar` with the username as fallback, and add a `useQuery` that polls `tracked_profiles` for `avatar_url` updates. Alternatively, since the page navigates away after scan completes, we can just show the initials-based fallback via `InstagramAvatar` component (which already handles missing avatars gracefully with colored initials circle).

**Simplest approach**: Replace `ui-avatars.com` img with `InstagramAvatar` component. It will show initials initially, and if `avatar_url` exists on the profile, show it.

### 2. Progress bar broken — `gradient-bg` CSS class doesn't exist
**Line 102**: `className="h-full gradient-bg rounded-full"` — the class `gradient-bg` is not defined anywhere in `index.css`. The progress bar appears gray/invisible.

**Fix**: Replace `gradient-bg` with `gradient-pink` (which exists and provides the pink gradient) or use inline `background: linear-gradient(...)`.

### 3. Gender ratio 50/50 — only 48 of 262 followings in DB
**Root cause**: `create-baseline` ran and loaded ~240 users from the API, but most DB inserts likely failed (RLS blocks inserts from service-role-less context, or the inserts silently failed). The function set `baseline_complete: true` and gender counts to 85/85/70 based on what it counted in memory, but actual `profile_followings` rows are only 48 (from `trigger-scan`).

The UI reads gender from `profile_followings` table (17f/17m = 50/50).

**Fix (two parts)**:
- **A) `create-baseline` bug**: The gender counts stored on `tracked_profiles` (85/85/70) should reflect what's actually in the DB, not what was counted in memory. After all inserts, re-count from DB. Also, add error checking on inserts.
- **B) Re-run for Tim**: Reset `baseline_complete = false` for Tim's profile, then trigger `create-baseline` via service-role. This will now work correctly with the service-role auth fix already deployed.
- **C) UI fallback**: When `profile_followings` has fewer rows than expected (e.g. `followings.length` << `following_count`), fall back to `tracked_profiles.gender_female_count/gender_male_count` for the gender bar. This makes the UI resilient to incomplete profile_followings data.

## Changes

### `src/pages/AnalyzingProfile.tsx`
1. Import `InstagramAvatar` and add a query for the tracked profile's avatar
2. Replace `ui-avatars.com` img (lines 83-89) with `InstagramAvatar` component using username as fallback
3. Replace `gradient-bg` (line 102) with `gradient-pink`

### `supabase/functions/create-baseline/index.ts`
1. After all inserts/updates, query actual DB counts instead of relying on in-memory counters
2. Add `.select()` or error checking on insert calls to detect silent failures
3. Log any insert errors

### `src/pages/ProfileDetail.tsx`
1. Add fallback: when `followings.length` is much less than `following_count`, use `profile.gender_female_count` / `profile.gender_male_count` from `tracked_profiles` for the gender bar

### Manual action after deploy
- Reset Tim's `baseline_complete` to `false` and re-trigger `create-baseline`


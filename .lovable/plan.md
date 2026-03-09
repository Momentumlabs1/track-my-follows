

## Plan: SpyDetail Redesign, Scan Navigation, Suspicion Report Polish, Gender Analysis Review

### 1. SpyDetail Page Redesign (`src/pages/SpyDetail.tsx`)

**Current problems:** Overloaded with stats table, recent activity feed, and raw numbers. No storytelling.

**Changes:**
- **Remove** the "Spion-Bericht" stats table (total scans, avg changes/day etc.) and the "Letzte Aktivität" recent events list entirely.
- **Add storytelling section** below the spy icon: A short narrative card explaining what the spy does ("Dein Spion überwacht rund um die Uhr... stündliche Scans, Unfollow-Erkennung, Geschlechteranalyse"). Use 3 small feature bullets with icons.
- **Show current assignment** more prominently: The watched profile card with avatar, username, follower count — styled as a clear "Aktueller Einsatz" section.
- **Scan buttons remain** (Push Scan + Unfollow Scan) but after triggering, **navigate to `/profile/{profileId}`** immediately instead of staying on SpyDetail. The scan runs, toast confirms result, and user lands on the profile page where the data appears.
- Keep the editable spy name and the SpyIcon with breathing animation.

### 2. Scan Navigation Fix

**Push Scan:** After `handlePushScan` completes successfully, call `navigate(\`/profile/${spyProfile.id}\`)`.

**Unfollow Scan:** After `handleUnfollowScan` completes successfully, navigate to `/profile/${spyProfile.id}` and auto-switch to the "Entfolgt" tab (via URL search param or state).

### 3. Suspicion Report ("Spion-Bericht") Polish (`src/components/SuspicionMeter.tsx`)

- Keep the circular gauge as-is (it works well).
- The factor list: add the factor icon emoji before each `simpleLabel`, add subtle right-side score indicator (e.g., small colored dot or mini bar).
- Better spacing and slightly larger text for readability.

### 4. Gender Analysis — Status & Explanation

**How it currently works:**
- Gender data is computed during `create-baseline` edge function (runs once after profile add).
- Results are stored as `gender_female_count`, `gender_male_count`, `gender_unknown_count` on `tracked_profiles`.
- The ProfileDetail page shows the gender bar when `genderTotal > 0`.
- A loading banner shows when baseline is incomplete AND no gender data exists yet.

**The problem:** If the baseline function failed, timed out, or the profile has 0 followings, gender data never populates. The "Gender-Analyse läuft" banner stays forever if `baseline_complete` remains `false` and counts remain 0.

**Fix:** 
- Add a timeout condition: If `spy_assigned_at` or `created_at` is older than 10 minutes and still no gender data, show a "Gender-Analyse nicht verfügbar" message instead of an infinite spinner.
- On ProfileDetail, also trigger gender display from `profile_followings` gender_tag data as fallback (the table already has `gender_tag` column).

### Files to modify:
1. `src/pages/SpyDetail.tsx` — Major rewrite (simplify, storytelling, post-scan navigation)
2. `src/components/SuspicionMeter.tsx` — Polish factor display
3. `src/pages/ProfileDetail.tsx` — Gender loading timeout, scan navigation state handling

### Technical Details

**SpyDetail storytelling structure:**
```text
┌─────────────────────────┐
│     SpyIcon (80px)      │
│     "Spion 🕵️"          │
│     Seit 12. Feb 2026   │
│                         │
│  ┌─ Aktueller Einsatz ─┐│
│  │ 📷 @username         ││
│  │ 1.2K Follower    →  ││
│  └─────────────────────┘│
│                         │
│  ┌─ Was kann dein Spion─┐│
│  │ 🔍 Stündliche Scans  ││
│  │ 👁 Unfollow-Erkennung││
│  │ ♀♂ Geschlechteranalyse│
│  └─────────────────────┘│
│                         │
│  [Push Scan] [Unfollow] │
│  → navigates to profile │
└─────────────────────────┘
```

**Gender timeout logic:**
```typescript
const profileAge = Date.now() - new Date(profile.created_at).getTime();
const genderTimedOut = profileAge > 10 * 60 * 1000 && genderTotal === 0;
// Show "nicht verfügbar" instead of spinner
```


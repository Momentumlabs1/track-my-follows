

## Problem Analysis

### Data Issues Found
1. **Gender DB counts are ALL ZERO** — `gender_female_count=0, gender_male_count=0, gender_unknown_count=0` on this profile. The `create-baseline` function apparently never ran or failed for this profile. Only 48 of 264 followings are in `profile_followings`, and of those only 9 are tagged female, 39 unknown, 0 male.
2. **Zero real follow events** — All 48 `follow_events` have `is_initial=true`. No real activity detected yet, so all 7-day metrics correctly show nothing.
3. **Gender bar is hidden** because `showGender = (0+0) > 0 = false`. The DB aggregates are empty.

### Visual Issues
4. The Spy Findings tiles, Weekly Cards, and Spy Status are all plain white `native-card` on a near-white `bg-background` — no contrast, no branding, no visual hierarchy. Everything blends together.
5. SpyStatusCard ("Dein Spy ist... Gelassen") is buried at the bottom with no brand presence.
6. The SpyIcon is missing from the status area.

---

## Plan

### Fix 1: Gender Bar Fallback — Count from `profile_followings` when DB aggregates are 0

Since `gender_female_count` etc. are 0 (baseline didn't update them), add a fallback: if all three DB counts are 0 but `followings` array has data, count `gender_tag` from the loaded `followings` array as a secondary source. This ensures the bar shows *something* while the baseline is incomplete.

**In `ProfileDetail.tsx`:**
```
let femaleCount = profile?.gender_female_count ?? 0;
let maleCount = profile?.gender_male_count ?? 0;
let unknownGenderCount = profile?.gender_unknown_count ?? 0;

// Fallback: if DB aggregates are empty, count from loaded followings
if (femaleCount + maleCount + unknownGenderCount === 0 && followings.length > 0) {
  for (const f of followings) {
    if (f.gender_tag === 'female') femaleCount++;
    else if (f.gender_tag === 'male') maleCount++;
    else unknownGenderCount++;
  }
}
```

### Fix 2: Move SpyStatusCard UP — directly after Gender Bar, before Findings

The "Dein Spy ist..." card is the most branded, most interesting element. It should be the FIRST analysis block users see, not the last. Reorder to:

```
Gender Bar
→ SpyStatusCard ("Dein Spy ist...")
→ SpyFindings (2x2 grid)  
→ WeeklyGenderCards
```

### Fix 3: SpyStatusCard — Add SpyIcon + stronger visual branding

- Add the SpyIcon (32px) next to "Dein Spy ist..." title
- Give the card a subtle brand tint based on level (green/yellow/orange/red at ~6% opacity as background)
- Make the level indicator bar thicker (6px instead of 4px)
- Larger level label (1.5rem)

### Fix 4: SpyFindings tiles — Add subtle level-based background tinting

Currently plain white cards with grey text. Each tile should get a subtle background tint based on its level:
- safe: `hsl(142 71% 45% / 0.06)` (green tint)
- warning: `hsl(45 100% 51% / 0.06)` (yellow tint)  
- danger: `hsl(4 90% 58% / 0.06)` (red tint)

Plus a matching subtle border. This gives each tile visual weight without being heavy.

### Fix 5: WeeklyGenderCards — Show "0" state more gracefully

When both cards show 0 (as now, because no real events exist), the empty state needs to not look broken. Add a subtle message: "Noch keine Aktivität in der letzten Woche" when both are 0, instead of two dimmed empty cards.

### Fix 6: SpyFindings data — when no 7d events, show profile-level insights instead of all dashes

Currently with 0 real events, tiles show: "–", "Ruhig", "–", "Selektiv". The Frauen-Anteil tile should fall back to the overall gender ratio (from DB or followings) when there are no 7d events, clearly labeled. This way the grid isn't half-empty on first view.

**Files changed:**
- `src/pages/ProfileDetail.tsx` — gender fallback + reorder components
- `src/components/SpyStatusCard.tsx` — add SpyIcon, level tint bg, stronger branding
- `src/components/SpyFindings.tsx` — level-tinted tile backgrounds, gender fallback
- `src/components/WeeklyGenderCards.tsx` — better empty state




## Plan: Profil-Seite komplett neu – 3 Tabs, alles oberhalb

### Current State
- 4 tabs including "Insights" (line 171)
- Insights tab content at lines 489-524 renders `NewFollowsBubbles` + `SuspicionScoreCard`
- Header uses glassmorphism (`rgba`, `backdrop-filter: blur`) everywhere
- Spy circle uses glassmorphism
- `suspicionAnalysis.ts` already correct (4 factors, `is_initial` filtered)

### Changes

#### 1. `src/pages/ProfileDetail.tsx` — Major restructure

**Remove Insights tab:**
- Line 44: Change `TabId` to `"new_follows" | "new_followers" | "unfollowed"` (remove `"insights"`)
- Line 171: Delete the insights tab entry from `tabs` array
- Lines 489-524: Delete entire `activeTab === "insights"` block

**Move Bubbles + Score ABOVE tabs** (between gender bar and banners, around line 355):
- Insert `NewFollowsBubbles` component
- Insert `SuspicionScoreCard` (or "building analysis" fallback)
- Keep the Pro/Spy lock overlay logic (blur + button) around these components
- Gap: 16px between elements

**Replace all glassmorphism with solid fills:**
- Spy circle (line 237): `background: "#2C2C2E"` instead of `rgba(255,255,255,0.06)` + blur
- Stat cards (lines 277-302): `background: "#1C1C1E"` instead of rgba + blur, remove `backdropFilter` and `border`
- Gender bar track (line 325): `background: "#2C2C2E"` instead of `rgba(255,255,255,0.06)`

**Gender bar upgrade:**
- Height from 6px (`h-1.5`) to 8px, border-radius 4px
- Font size for ♀/♂ numbers: 16px bold

#### 2. `src/components/NewFollowsBubbles.tsx` — Solid fills

- Card wrapper: `background: "#1C1C1E"`, remove blur/border
- Female bubble: `background: "#FF2D55"` (solid pink, not `rgba(255,45,85,0.12)`)
- Male bubble: `background: "#007AFF"` (solid blue, not `rgba(0,122,255,0.12)`)
- Number color: white (since bubbles are now solid colored)
- Emoji: 24px, Number: 28px

#### 3. `src/components/SuspicionScoreCard.tsx` — Solid fills

- Card wrapper: `background: "#1C1C1E"`, remove blur/border
- Progress bar track: `background: "#2C2C2E"`
- "Not enough data" card: same solid background
- Chip backgrounds solid:
  - Safe: `#1B3A2A`, Warning: `#3A3420`, Danger: `#3A1B1B`
  - Replace current `rgba(...)` values in `levelBgColor`

#### 4. `src/lib/suspicionAnalysis.ts` — No changes needed
Already has 4 factors (Gender 40, Activity 30, Churn 15, Ratio 15), filters `is_initial`, and uses `gender_tag` from followings. Correct as-is.

### Layout (top to bottom after changes)
```text
Nav bar (back, @username, delete)
Avatar (80px) + Spy (70px, solid #2C2C2E)
Username + Bio
Follower card + Following card (solid #1C1C1E)
Gender bar (8px, solid track #2C2C2E)
--- NEW: Bubbles card (solid #1C1C1E, solid pink/blue circles) ---
--- NEW: Score card (solid #1C1C1E) OR "building" fallback ---
Banners (assign spy, private warning)
3 Tabs: Folgt neu | Neue Follower | Entfolgt
Tab content (lists, unchanged)
```


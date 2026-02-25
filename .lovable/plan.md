

## Dashboard Redesign: Spy Agent System with Animated Drag-and-Drop

### Problem Analysis (from Screenshot)

The current Dashboard has these issues:
1. **Too many SpyIcons everywhere** -- logo, greeting, assignment card header, assignment card button, draggable spy, spy of the day, profile badges = visual noise
2. **Spy des Tages is BELOW the assignment card** -- wrong order
3. **Greeting has a SpyIcon** next to "Hey" -- unnecessary, clutters the greeting
4. **Drag-and-drop doesn't work reliably** and the "Drag me!" spy floats awkwardly to the right
5. **No visual hierarchy** between sections -- everything looks the same pink gradient

---

### New Layout (Top to Bottom)

```text
┌─────────────────────────────────┐
│  🕵️ SpySecret              🔄  │  ← Logo bar (keep as-is)
├─────────────────────────────────┤
│                                 │  ← More top padding (pt-6)
│  Hey ewcwe!                     │  ← Clean text, NO spy icon
│  Du trackst 3 Profile           │
│                                 │
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← SPY DES TAGES (full-width
│ ▓ 📋 SPY DES TAGES            ▓ │     solid pink background,
│ ▓ @giiiiint neuer Follower     ▓ │     white text, edge-to-edge)
│ ▓ 📍 saif_nassiri              ▓ │     NO mx-4, NO rounded corners
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │     on left/right
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────┐ ┌───┐  │
│  │ AGENT ÜBERWACHT  🟢 │ │🕵️│  │  ← Spy card + draggable agent
│  │ [Avatar] @mtlabs.ai │ │   │  │     The 🕵️ sits ON the card
│  │ Letzter: 1h ago     │ │   │  │     (positioned top-right,
│  │ Nächster: Jetzt      │ └───┘  │     overlapping edge)
│  │                     │        │
│  │ [Spy verschieben]   │        │
│  └─────────────────────┘        │
│                                 │
│  DEINE PROFILE                  │
│  ┌─────────────────────────┐    │
│  │ Profile cards...        │    │  ← Drop zones for drag
│  └─────────────────────────┘    │
```

---

### Detailed Changes

#### 1. `Dashboard.tsx` -- Layout Reorder and Cleanup

**Greeting section:**
- Remove `<SpyIcon size={28} />` from the h1
- Add more top padding: `pt-[calc(env(safe-area-inset-top)+24px)]` and `mb-6` after greeting
- Just clean bold text: "Hey {displayName}!"

**Section order (after greeting):**
1. Spy des Tages (full-width pink banner)
2. Spy Assignment Card with integrated draggable agent
3. Profile list
4. Event feed

**Remove duplicated Spy of the Day sections.** Currently there are 3 conditional blocks for spy-of-the-day (free teaser, pro version, and no-activity fallback). Consolidate into ONE section right after greeting.

#### 2. Spy des Tages -- Full-Width Pink Banner

Create a visually distinct, edge-to-edge banner:
- **No `mx-4`** -- goes full width to screen edges
- **Solid `gradient-pink` background** (not border with transparent inside)
- **White text** (`text-white`) for all content inside
- **📋 emoji** as section identifier (NOT the spy icon)
- Subtle entry animation: `motion.div` with `opacity: 0, y: -10` → `opacity: 1, y: 0`
- For **Free users**: same layout but with `opacity-50 grayscale` overlay + lock icon + click → paywall
- For **Pro users with no events**: show "Keine Aktivität heute" in muted style within the pink banner

#### 3. New `SpyAgentCard.tsx` -- The Core Interaction Component

Replace both `SpyAssignmentCard` and `DraggableSpy` with ONE unified component.

**Layout:**
- Standard `native-card` background (dark card, NOT pink -- differentiates from Spy des Tages)
- Header: "AGENT ÜBERWACHT" + green pulse dot + "Aktiv" label
- Body: Avatar + username + scan times
- Button: "Spy verschieben" (fallback for non-drag users)
- **The draggable spy icon** is positioned `absolute` at `top-[-16px] right-[-8px]`, overlapping the card edge like a sticker/badge

**Drag-and-Drop with Framer Motion (not native HTML5 D&D):**

The current native HTML5 drag-and-drop is unreliable on touch devices and has poor visual feedback. Replace with **Framer Motion's drag system**:

```typescript
<motion.div
  drag
  dragSnapToOrigin   // flies back to origin when released outside drop zone
  dragElastic={0.2}
  dragMomentum={false}
  whileDrag={{ scale: 1.2, zIndex: 999 }}
  onDragEnd={(_, info) => {
    // Check if pointer is over a profile card using elementFromPoint
    const el = document.elementFromPoint(info.point.x, info.point.y);
    const dropTarget = el?.closest('[data-profile-id]');
    if (dropTarget) {
      const profileId = dropTarget.getAttribute('data-profile-id');
      handleMoveSpy(profileId);
    }
  }}
>
  <SpyIcon size={56} glow />
</motion.div>
```

**Key advantages of Framer Motion drag:**
- `dragSnapToOrigin` = automatic spring-back animation (the "flies back up" effect)
- Works on both touch AND mouse
- Smooth 60fps animations, no browser drag ghost images
- `whileDrag` for instant visual scaling feedback
- `dragConstraints` not needed since `dragSnapToOrigin` handles return

**Animation when spy is reassigned:**
- Use `layoutId="spy-agent"` on the SpyIcon so when the profile changes, it automatically animates position with Framer Motion's layout animations
- The card content (avatar, username) transitions with a `key={spyProfile.id}` and `AnimatePresence` for exit/enter animations

#### 4. `ProfileCard.tsx` -- Drop Zone Updates

- Remove the HTML5 drag event handlers (`onDragOver`, `onDragLeave`, `onDrop`)
- Add `data-profile-id={profile.id}` attribute for `elementFromPoint` detection
- During drag (communicated via context or prop `isDragging`), show a subtle pulsing ring animation on all non-spy profile cards as visual hint
- Remove the "Assign Spy" button below the card -- the drag interaction replaces it
- Remove the SpyIcon badge on avatar for the watched profile (it's already shown in the agent card above)

#### 5. Animation Details

| Interaction | Animation | Implementation |
|---|---|---|
| Spy icon pickup | Scale 1.0 → 1.2 + shadow increase | `whileDrag={{ scale: 1.2 }}` |
| Spy icon release (no target) | Spring back to origin | `dragSnapToOrigin` with spring config |
| Spy icon drop on profile | Brief scale pulse on target card | `animate` trigger on successful drop |
| Profile swap in agent card | Crossfade avatar + text | `AnimatePresence` + `motion.div` with key |
| Spy des Tages banner entry | Slide down from top | `initial={{ y: -20, opacity: 0 }}` |
| Drop zone hint during drag | Border pulse on eligible cards | CSS animation class toggled via state |

#### 6. Files to Modify

| File | Action |
|---|---|
| `src/pages/Dashboard.tsx` | Reorder sections, remove SpyIcon from greeting, consolidate spy-of-day blocks, integrate new drag system |
| `src/components/SpyAgentCard.tsx` | **NEW** -- replaces SpyAssignmentCard + DraggableSpy |
| `src/components/SpyAssignmentCard.tsx` | **DELETE** -- replaced by SpyAgentCard |
| `src/components/DraggableSpy.tsx` | **DELETE** -- integrated into SpyAgentCard |
| `src/components/ProfileCard.tsx` | Remove HTML5 D&D, add `data-profile-id`, add drag-active visual hint |

#### 7. Free vs Pro Logic

- **Free users**: See Spy des Tages as greyed-out pink banner with 🔒 overlay. No Agent Card. No drag. Click → paywall.
- **Pro users**: Full pink Spy des Tages banner + Agent Card with draggable spy + profile drop zones.


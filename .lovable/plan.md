

# Fix: Tutorial Buttons + Visual Cleanup

## Problem
The outer `motion.div` and SVG overlay catch all pointer events, blocking clicks on both tooltip buttons AND the highlighted target element (e.g. the "+" button).

## Changes

### 1. `src/components/SpotlightOverlay.tsx` — pointer-events fix + visual cleanup

**pointer-events hierarchy:**
- Outer wrapper `motion.div`: `pointerEvents: "none"` — lets clicks pass through
- SVG mask overlay: `pointerEvents: "none"` — purely visual
- Tooltip container `motion.div`: `pointerEvents: "auto"` — catches button clicks

**For steps where user clicks a real element** (hideButton steps): The target element sits below the overlay. Since the overlay has `pointer-events: none`, clicks naturally reach the target. The click listener in `AppTutorial.tsx` (line 120-128) already handles advancing the step via document capture.

**Visual cleanup:**
- Remove border from tooltip card, add `boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"`
- Dots: gap from `1.5` to `2`, size stays at 6px (already correct)
- Button: already full width + 48px, keep as-is

### 2. `src/components/AppTutorial.tsx` — no structural changes needed

The click capture handler (line 116-130) works correctly once pointer-events are fixed. The fullscreen steps already have proper `onClick` handlers on their buttons — they work because they're not behind the SVG overlay.

### Files changed
- `src/components/SpotlightOverlay.tsx`


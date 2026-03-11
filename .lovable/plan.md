

## Plan: SpyStatusCard Redesign

### Changes to `src/components/SpyStatusCard.tsx`:

**Layout restructure** — Right side becomes a single column with:
1. **"Dein Spy ist:"** label (small, muted) at the top
2. **"Gelassen 😌"** + **"0/100"** on the same row below it (smaller text than current)
3. **Remove** the description text entirely
4. **Make the card clickable** — wrap in a button/clickable div. On click, open a Sheet/Dialog showing the description text and level explanation.

**Specific changes:**
- Add `useState` for info sheet open/close
- Import `Sheet` from `@/components/ui/sheet`
- Replace description paragraph with nothing — card becomes compact
- Add "Dein Spy ist:" as a small label above the level name
- Put level label + emoji and score on one line: `Gelassen 😌  0/100`
- Add a subtle chevron or info icon to hint clickability
- Sheet content shows: level description, what each level means, early estimate note if applicable


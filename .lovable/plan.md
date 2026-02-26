

## Plan: Dashboard Scroll & Drag Performance Fix

### Root Causes
1. **ProfileCard**: `viewport={{ once: true }}` has NO effect because it's paired with `initial`/`animate` instead of `whileInView`. Elements re-animate every time React re-renders them.
2. **Inline arrows break memo**: `onTap={() => handleProfileTap(profile.id)}` and `onAssignSpy={() => handleMoveSpy(profile.id)}` create new functions every render, defeating `React.memo`.
3. **Ref warning**: Console errors for ProfileCard and DaySeparator — `memo` components receiving refs without `forwardRef`.

### Changes

**1. `ProfileCard.tsx`**
- Replace `initial`/`animate` with `whileInView` + `viewport={{ once: true }}` for the entry animation
- Keep `animate` only for drag-related scale changes (conditional)
- Remove `transition-[transform]` CSS class (conflicts with framer)

**2. `Dashboard.tsx`**
- Create stable `onTap`/`onAssignSpy` callbacks using `useCallback` with profile ID maps, or pass profile ID as prop and let card call back
- Wrap `handleMoveSpy` in `useCallback`
- Limit event feed to 100 events max via `useMemo` slice

**3. `EventFeedItem.tsx`**
- Already correct with `whileInView` + `viewport={{ once: true }}` — no changes needed

**4. `DaySeparator.tsx`**
- Wrap in `memo` to prevent re-renders


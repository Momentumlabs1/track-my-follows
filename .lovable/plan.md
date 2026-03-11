

## Plan: Remove Frauen-Anteil Card from SpyFindings

The gender ratio is already shown inline in the header as a bar. The duplicate "Frauen-Anteil" donut card in SpyFindings should be removed.

### Changes in `src/components/SpyFindings.tsx`:
1. **Delete Card 1** (lines 124-156) — the entire "Frauen-Anteil" wide card with donut
2. **Remove unused data** — `femalePercent`, `femaleLevel`, `totalFemale`, `totalMale` from the `useMemo` (lines 33-49) since no other card uses them
3. **Remove `levelColor` function** (lines 112-116) since it was only used by the Frauen-Anteil card

The remaining 3 cards (Ghost-Follows, Private Accounts, Followback-Rate) stay as-is.


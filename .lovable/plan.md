

## Plan: Dashboard Performance & Scroll-Fixes

### Problem
1. **Elemente verschwinden beim Scrollen** – Jede `motion.div` in `ProfileCard` und `EventFeedItem` hat `initial={{ opacity: 0, y: 12 }}`. Wenn Elemente aus dem Viewport scrollen und zurückkommen, spielt framer-motion die Einblend-Animation erneut ab (opacity 0 → 1), was als "Verschwinden" wahrgenommen wird.
2. **Ruckeln beim Drag** – `spyDragging` und `hoveredProfileId` State-Änderungen lösen Re-Renders des gesamten Dashboards aus, inkl. aller ProfileCards und EventFeedItems.

### Umsetzung

**1. `ProfileCard.tsx` – `React.memo` + Scroll-Fix**
- Component in `React.memo` wrappen
- `initial` auf `false` setzen wenn `isDragging` aktiv, sonst Animation nur beim ersten Mount abspielen (via `useRef` Flag)
- Oder: `initial` komplett durch `whileInView` ersetzen mit `once: true` – damit animiert es nur einmal

**2. `EventFeedItem.tsx` – `React.memo` + einmalige Animation**
- `React.memo` wrappen
- `initial={{ opacity: 0, y: 12 }}` → Viewport-basiert mit `viewport={{ once: true }}` statt `initial/animate`, damit Items nicht bei Re-Scroll verschwinden

**3. `SpyAgentCard.tsx` – Drag-Performance**
- `onDrag` Throttling von 80ms auf 60ms ist okay, aber `onHoverProfileChange` sollte nur feuern wenn sich der Wert ändert (deduplizieren mit `useRef`)

**4. `Dashboard.tsx` – State-Isolation**
- `setHoveredProfileId` und `setSpyDragging` Callbacks mit `useCallback` wrappen
- ProfileCard `onTap` mit `useCallback` statt inline Arrow

### Betroffene Dateien
- `src/components/ProfileCard.tsx`
- `src/components/EventFeedItem.tsx`
- `src/components/SpyAgentCard.tsx`
- `src/pages/Dashboard.tsx`


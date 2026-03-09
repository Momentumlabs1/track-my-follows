

## Plan: Agent-Drag über gesamten Bildschirm + Spy-Zone Animationen

### Problem
1. **Agent verschwindet beim Draggen** hinter dem weissen Content-Bereich wegen `overflow-hidden` auf dem Header
2. Keine Animation wenn Spy einem neuen Account zugewiesen wird
3. Spy-Zone reagiert visuell nicht auf Drag-Status

### Lösung

#### 1. Drag-Clipping fixen (`Dashboard.tsx`)
- `overflow-hidden` vom Header-Container entfernen
- Stattdessen nur die SVG-Kurven mit eigenem `overflow-hidden` versehen
- SpyWidget braucht `position: fixed` oder sehr hohen `z-index` während des Drags — das macht framer-motion bereits über `whileDrag: { zIndex: 9999 }`, aber der Parent clippt es. Fix: Den SpyWidget über ein **React Portal** (`createPortal`) rendern während `isDragging === true`, damit er aus dem DOM-Fluss raus ist und über allem schwebt

#### 2. Spy-Zone reagiert auf Drag (`Dashboard.tsx`)
- Wenn `isDragging === true`: Der überwachte Account im Spy-Bereich wird **ausgegraut** (opacity 0.3, grayscale filter)
- Wenn Agent losgelassen wird ohne Ziel: Account wird wieder farbig (opacity 1, kein filter)
- Animiert über `motion.div` mit `animate={{ opacity: isDragging ? 0.3 : 1, filter: isDragging ? "grayscale(1)" : "grayscale(0)" }}`

#### 3. Professionelle Zuweisung-Animation (`Dashboard.tsx` + `SpyAgentCard.tsx`)
- Neuer State: `assigningProfileId` — wird gesetzt wenn ein Account dem Spy zugewiesen wird
- **Animation-Sequenz** bei erfolgreicher Zuweisung:
  1. Der neue Account (ProfileCard) bekommt `layoutId` und animiert nach oben zum Spy-Bereich (framer-motion `AnimatePresence` + `layout`)
  2. Der alte Account im Spy-Bereich faded aus (`exit={{ opacity: 0, scale: 0.8 }}`)
  3. Der neue Account erscheint im Spy-Bereich (`initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}`)
- Agent snappt zurück zu seinem Platz (bereits via `dragSnapToOrigin`)

#### 4. SpyWidget aus overflow-hidden befreien (`SpyAgentCard.tsx`)
- Während des Drags: Render über `ReactDOM.createPortal(dragElement, document.body)` damit der Agent über **allem** schwebt
- Alternativ einfacher: `overflow-hidden` nur auf den SVG-Wrapper setzen, nicht auf den gesamten Header-Container

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Dashboard.tsx` | `overflow-hidden` entfernen/umstrukturieren, Spy-Zone Fade bei Drag, Zuweisungs-Animation |
| `SpyAgentCard.tsx` | Portal-Rendering während Drag für volle Bildschirm-Mobilität |
| `ProfileCard.tsx` | Keine Änderung nötig (hat bereits `data-profile-id` und drop-target highlighting) |


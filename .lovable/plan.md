

## Plan: Spy-Icon separat vom Hintergrund draggen + Drop-Animation fixen

### Problem
Das gesamte SpyWidget-Container (inkl. Hintergrund, Border, Text) wird beim Drag mitgezogen. Nur das **SpyIcon selbst** soll sich bewegen — der Container/Dock bleibt stehen als Platzhalter.

### Lösung

#### 1. SpyAgentCard.tsx — Icon vom Container trennen
- Der äussere Container (`rounded-2xl border bg-primary-foreground/10`) wird **statisch** und bleibt immer an Ort und Stelle
- Nur das `SpyIcon` bekommt `motion.div` mit `drag`, `dragSnapToOrigin` etc.
- Während des Drags: Container zeigt einen pulsierenden Platzhalter-Kreis (ghost) wo das Icon war
- Das Icon schwebt frei über allem mit `style={{ position: "fixed" }}` via `whileDrag` und `zIndex: 99999`
- Tap-Erkennung bleibt auf dem Icon

#### 2. Dashboard.tsx — Stacking Context fixen
- Sicherstellen dass der Content-Bereich unter dem Header (`bg-background`) NICHT über dem dragging Icon liegt
- Die Account-Sektion braucht `position: relative` mit niedrigerem `z-index` als das dragging Icon
- Header bleibt `overflow: visible`

#### 3. Drop-Animation auf ProfileCard
- Wenn `isHovered` (Agent schwebt über einer ProfileCard): Pulsierender Border + leichte Scale-Animation (bereits vorhanden in ProfileCard)
- Bei erfolgreichem Drop (`handleMoveSpy`): 
  - `justAssigned` State triggert die `AnimatePresence` im Spy-Bereich (bereits vorhanden — `initial={{ opacity: 0, y: 30, scale: 0.95 }}`)
  - Zusätzlich: Kurzer "success flash" auf der ProfileCard die gerade zugewiesen wurde via neuem `assignedProfileId` State

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `SpyAgentCard.tsx` | Container statisch machen, nur Icon ist draggable, Ghost-Platzhalter während Drag |
| `Dashboard.tsx` | z-index Stacking fixen damit Icon über Content schwebt, `assignedProfileId` State für Drop-Feedback |


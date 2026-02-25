

## Problem-Analyse

Zwei zusammenhängende Bugs im Drag-and-Drop des Spy-Elements:

### 1. Ruckeln (Jank)
Der `onDrag`-Callback feuert bei **jedem einzelnen Frame** (~60x/Sekunde) und ruft jedes Mal `document.elementsFromPoint()` + DOM-Traversal auf. Das ist teuer und verursacht Frame-Drops.

### 2. Versetztes Highlighting
`e.target` im `onDrag`/`onDragEnd`-Callback zeigt auf das **innere** `motion.div` (das mit der `dropSuccess`-Animation), nicht auf den äußeren Drag-Container. Wenn `findProfileUnderPoint` nur auf dem inneren Element `pointer-events: none` setzt, blockiert der **äußere Container** weiterhin `elementsFromPoint()` — dadurch wird die falsche oder gar keine ProfileCard erkannt, und das Highlighting erscheint versetzt oder springt.

### Lösung

**Datei: `src/components/SpyAgentCard.tsx`**

1. **Ref statt `e.target`**: Einen `useRef` auf den äußeren draggbaren `motion.div` setzen. In `findProfileUnderPoint` wird dann `pointer-events: none` auf diesen Ref gesetzt — nicht auf `e.target`. So wird die gesamte Drag-Fläche korrekt ausgeblendet und `elementsFromPoint` findet die richtige ProfileCard.

2. **`onDrag` throttlen**: Die Hit-Detection auf maximal alle ~80ms beschränken (per Timestamp-Check), statt bei jedem Frame. Das reduziert DOM-Queries um ~80% und eliminiert das Ruckeln.

3. **`e.target`-Zugriffe entfernen**: `onDrag` und `onDragEnd` verwenden nur noch den Ref, nicht mehr `e.target`.

Konkret werden in `SpyAgentCard.tsx` folgende Änderungen gemacht:
- `useRef<HTMLDivElement>` hinzufügen, auf den äußeren `motion.div` (Zeile 148) binden
- `findProfileUnderPoint` anpassen: statt `dragEl`-Parameter den Ref verwenden
- `onDrag`: Timestamp-basiertes Throttling (letzte Ausführung merken, nur alle 80ms erneut ausführen)
- `onDragEnd`: Ref statt `e.target` für die finale Drop-Erkennung

Keine Änderungen an `ProfileCard.tsx` nötig — das Highlighting dort ist korrekt implementiert und reagiert nur auf den `isHovered`-State.


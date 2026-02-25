

## Problem-Analyse

Aus dem Screenshot ist klar erkennbar: Der Spy schwebt visuell über **@mtlabs.ai**, aber das Highlighting ist auf **@strichabi** (eine Karte darunter). Das liegt daran, dass `info.point` die **Cursor/Finger-Position** liefert — nicht die **visuelle Mitte des Spy-Icons**. Da das Icon 72px groß ist, kann der Cursor weit vom visuellen Zentrum entfernt sein (z.B. am oberen Rand des Icons), während `elementsFromPoint` dann die falsche Karte darunter findet.

## Lösung

**Datei: `src/components/SpyAgentCard.tsx`**

### 1. Hit-Detection auf Element-Mitte umstellen
Statt `info.point` (Cursor-Position) wird die **Bounding Box des dragRef-Elements** verwendet. `dragRef.current.getBoundingClientRect()` liefert die aktuelle visuelle Position des Spy-Icons, und dessen Mittelpunkt wird für `elementsFromPoint` genutzt.

Konkret in `onDrag` und `onDragEnd`:
```typescript
// Statt: info.point.x, info.point.y
// Neu:
const rect = dragRef.current!.getBoundingClientRect();
const cx = rect.left + rect.width / 2;
const cy = rect.top + rect.height / 2;
const hovered = findProfileUnderPoint(cx, cy);
```

### 2. Spy-Icon größer machen
- Draggable SpyIcon: `size={72}` → `size={96}`
- Der Glow-Effekt skaliert automatisch mit

Keine weiteren Dateien betroffen.


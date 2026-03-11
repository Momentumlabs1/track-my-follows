

## Plan: Avatar + Spy-Icon mit animierter Verbindungslinie

### Konzept
Statt Avatar zentriert mit kleinem Badge → Avatar und SpyIcon **nebeneinander** mit einer animierten Verbindungslinie dazwischen. Die Linie symbolisiert "Agent trackt diesen Account". "Spy aktiv" Text wird entfernt.

### Layout
```text
    [Avatar 68px] ----~~~~~---- [SpyIcon 36px]
                  (animated line)
```

### Änderungen in `src/pages/ProfileDetail.tsx` (Lines 230-269)

**1. Avatar-Block neu:** Horizontal statt vertikal zentriert
- Avatar links (68px, pink ring wenn spy)
- SVG-Linie in der Mitte (~60px breit), animiert mit einem "Dash-Offset" Effekt (wandernde Punkte/Striche von Avatar zum Spy)
- SpyIcon rechts (36px, mit glow)
- Alles in einer `flex items-center justify-center gap-0` Row

**2. Animierte Linie:** SVG `<line>` mit `strokeDasharray` + CSS `@keyframes` für laufende Dash-Animation:
```tsx
<svg width="60" height="2" className="mx-2">
  <line x1="0" y1="1" x2="60" y2="1" 
    stroke="#FF2D55" strokeWidth="2" 
    strokeDasharray="4 4"
    style={{ animation: "dashMove 1.5s linear infinite" }}
  />
</svg>
```
Plus keyframes in `src/index.css`:
```css
@keyframes dashMove {
  to { stroke-dashoffset: -16; }
}
```

**3. "Spy aktiv" entfernen:** Die Verbindungslinie macht den Status klar. Wenn kein Spy → kein SpyIcon, keine Linie, nur Avatar zentriert wie bisher. ScanStatus bleibt für non-spy profiles.

**4. Username:** Bleibt zentriert darunter, ohne "Spy aktiv" Zeile.

### Dateien
| Datei | Änderung |
|-------|---------|
| `src/pages/ProfileDetail.tsx` | Header-Block Lines 230-269 umbauen |
| `src/index.css` | `@keyframes dashMove` hinzufügen |


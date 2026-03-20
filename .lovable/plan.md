

## Fix: Following-Box als Vollfarb-Gradient (ohne Extra-Balken)

Das Following-Rechteck soll **identisch aussehen wie vorher** (gleiche Größe, gleiche Zahlen-Position), aber der **gesamte Hintergrund** wird zum Gender-Gradient. Kein separater Balken darunter.

### Änderung in `src/pages/ProfileDetail.tsx` (Zeilen 281-306)

**Wenn `showGender` aktiv:**
- `background` wird `linear-gradient(to right, #FF2D55 ${femalePct}%, #007AFF ${femalePct}%)` statt `hsl(var(--card))`
- Zahl + "Following" Text → `text-white`
- ♀ und ♂ Symbole + Prozente als **dezente Overlay-Labels** (opacity 0.5, kleine Schrift) links unten / rechts unten im Rechteck
- **Kein separater `<div>` Balken**, kein extra `mt-2` Block
- `id="gender-bar"` kommt auf das äußere `<div>` des Rechtecks

**Wenn `showGender` NICHT aktiv:**
- Alles bleibt wie bisher (card background, normale Textfarben)

### Ergebnis

```text
┌──────────────┐  ┌──────────────┐
│    1,234     │  │    1,567     │
│  Followers   │  │  Following   │
│              │  │♀37%    ♂63%  │ ← opacity 0.5, klein
│  (card bg)   │  │(pink → blau) │
└──────────────┘  └──────────────┘
```

Gleiche Höhe, gleiche Struktur, nur der Hintergrund ändert sich.




## Plan: Spy-Kachel Redesign — Halbkreis statt Diagonale

### Problem
Der diagonale Schrägbalken zwischen hellem (Profil) und dunklem (Spy) Bereich sieht unnatürlich aus. Der Spy-Bereich nimmt zu viel Platz ein (40%), der Account hat zu wenig Raum.

### Änderungen

#### `Dashboard.tsx` (Zeilen 116-290)

**1. Dark-Bereich: Diagonale → Halbkreis rechts**
- Statt `clipPath: polygon(...)` einen **Halbkreis von rechts** als `border-radius` oder `clipPath: ellipse()` verwenden
- Dunkler Bereich wird schmaler (~35%), nur rechte Seite mit großem `border-radius` links (z.B. `ellipse(55% 100% at 100% 50%)`)
- Scan-line Effekt und Glow-Line an neuen clipPath anpassen

**2. Profil-Seite (links) bekommt mehr Platz**
- Von `width: 60%` auf `width: 65%`
- Avatar von 44px auf **50px**
- Username Font von `0.9375rem` auf `1rem`
- Follow-Stats Font von `0.625rem` auf `0.75rem`
- Mehr Klarheit: kleines Label "Wird überwacht von deinem Spion" o.ä.

**3. Spy-Seite (rechts) kompakter aber größer**
- Von `width: 40%` auf `width: 35%`
- SpyIcon von 72px auf **88px** — ragt leicht über den dunklen Bereich hinaus ins Helle
- "Ziehen · Spion" Text bleibt

**4. Helle Seite: volle Fläche als Basis**
- Statt clipPath auf der hellen Seite: einfach `background: rgba(255,240,245,0.95)` auf die **gesamte Karte**, dann dark Halbkreis darüber

### Visuelles Ziel
```text
┌──────────────────────────────────┐
│ 🔒 Aktuell im Fokus             │
│                          ╭──────│
│  (Avatar) @diego_gut1   │ 🕵️   │  ← Halbkreis dunkel
│  +358 Follows · -1 Unf  │      │
│  [ava][ava][ava]         ╰──────│
│                     Ziehen·Spion│
└──────────────────────────────────┘
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `Dashboard.tsx` | clipPath polygon → ellipse für dark-side, helle Seite als Basis-BG, Profil-Breite 65%, Spy 35%, Avatar/Font größer |
| `SpyAgentCard.tsx` | SpyIcon size 72→88px |


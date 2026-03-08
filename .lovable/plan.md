

## Dashboard Redesign – Hero-Header + Spy-Bereich + Profile Cards

### Was sich ändert

Der Dashboard-Screen wird in drei klar getrennte visuelle Zonen aufgeteilt:

**Zone 1 – Hero Header** (eigener, abgesetzter Hintergrund)
- Bekommt einen eigenen Hintergrund: im Dark Mode `#111111` (card-color), im Light Mode reines Weiß — hebt sich vom restlichen `--background` ab
- Logo + "SpySecret" oben links
- Darunter: **"Hey Diego! ❤️"** — groß (1.75rem/28px, bold), mit Herz-Emoji
- Die Zeile "Du trackst 3 Profile" wird entfernt — stattdessen nichts oder ein subtiler einzeiliger Satz wie "Dein Spion ist aktiv" (nur wenn Spy aktiv)
- Der Header hat großzügiges Padding (24px seitlich, 20px unten) und eine leichte Rundung nach unten oder einfach einen sauberen Farbübergang

**Zone 2 – Spy-Überwachungs-Bereich** (eigene abgegrenzte Section)
- Der gesamte Spy-Bereich (nicht nur die einzelnen Bubbles) bekommt einen eigenen Container mit `bg-card` Hintergrund und `rounded-2xl`
- Innerhalb des Containers:
  - Oben links: "SPY ÜBERWACHT" Label + rechts "● Aktiv" Badge
  - Der **Spy-Icon wird deutlich größer** (80-96px statt 48px) und prominent rechts platziert — nicht in einer eigenen kleinen Box, sondern als Teil des gesamten Bereichs
  - Links davon: Avatar des überwachten Profils (56-64px) mit pink Ring, Username, Scan-Zeiten
  - Layout: Der Spy und das Profil sind in einer einzigen durchgehenden Card, nicht zwei separate Bubbles nebeneinander
  - Der Spy bleibt draggable (Tap → /spy, Drag → reassign)
- Unfollow-Hint Banner bleibt innerhalb dieses Containers

**Zone 3 – Deine Profile** (wie "The Ick" Stil)
- Section-Header "DEINE PROFILE"
- Profile Cards bekommen wieder den vollständigen "The Ick"-Stil zurück:
  - Hauptbereich: Avatar (48px), @username, Scan-Status, Chevron
  - Darunter: Ein rosa/pink getönter Sub-Bereich für "Zuletzt gefolgt" mit den großen Avataren (40px) — dieser Sub-Bereich hat einen eigenen leichten pink Hintergrund-Tint (`bg-primary/5` light, `bg-primary/10` dark) und abgerundete Ecken unten
  - Die Avatare bleiben groß und überlappend, wie aktuell
- "Profil hinzufügen" Button darunter

### Dateien die geändert werden

1. **`src/pages/Dashboard.tsx`** — Layout-Struktur: Hero-Header bekommt eigene `div` mit `bg-card` + Rundung, Spy-Section wird als eigene Zone dargestellt
2. **`src/components/SpyAgentCard.tsx`** — Komplett überarbeitet: Ein einzelner Container statt zwei Bubbles, Spy-Icon 80-96px groß, Layout horizontal (Profil-Info links, großer Spy rechts)
3. **`src/components/ProfileCard.tsx`** — "Zuletzt gefolgt"-Bereich bekommt pink-getönten Hintergrund mit eigener Rundung, ähnlich "The Ick"

### Visuelles Layout (vereinfacht)

```text
┌─────────────────────────────── bg-card ──┐
│  [Logo] SpySecret                         │
│                                           │
│  Hey Diego! ❤️                            │
│  Dein Spion ist aktiv.                    │
└───────────────────────────────────────────┘

┌──────────────────────────── bg-card ──────┐
│  SPY ÜBERWACHT                    ● Aktiv │
│                                           │
│  ┌──────┐                    ┌────────┐   │
│  │Avatar│  @saif_nassiri     │  🕵️   │   │
│  │ 56px │  Letzter Scan...   │  80px  │   │
│  │      │  Nächster Scan...  │ (drag) │   │
│  └──────┘                    └────────┘   │
│                                           │
│  [⚠️ Unfollow-Hint falls vorhanden]      │
└───────────────────────────────────────────┘

  DEINE PROFILE

┌───────────────────────────────────────────┐
│  [Avatar] @strichabi        Vor 2 Std. >  │
│  ┌─────────────── bg-primary/5 ─────────┐ │
│  │ Zuletzt gefolgt   [👤][👤][👤][👤]   │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```


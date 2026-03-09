

## Plan: Suspicion-Bereich & "Was wir gefunden haben" komplett neu designen

### Probleme (Screenshot)
1. **Gauge sieht billig aus** — SVG-Halbkreis mit dicken grünen Balken, keine Tiefe, kein Premium-Feeling
2. **"Was wir gefunden haben"** — langweilige Liste mit Emoji-Dots, kein Spy-Branding, sieht aus wie eine Debug-Ausgabe
3. **Gender 0%/100%** — Daten stimmen möglicherweise nicht (zeigt 0 Frauen obwohl evtl. welche da sind), aber das ist ein Daten-Thema, kein Design-Thema
4. **Kein Spy-Branding** — der gesamte Analyse-Bereich fühlt sich nicht nach "Spion-App" an

### Änderungen

#### 1. `SuspicionGauge.tsx` — komplett neu
- **Weg mit dem SVG-Halbkreis**. Stattdessen: Clean circular progress ring (voller Kreis, dünn, 160px)
- Score groß in der Mitte (`3rem`, `font-extrabold`), darunter "Verdachts-Score" klein
- Ring-Farbe: grün/gelb/rot je nach Score, mit subtiler `drop-shadow` (kein fetter glow-Filter)
- Emoji + Label darunter zentriert, etwas größer (`1rem` statt `text-sm`)
- Sparkline bleibt unverändert

#### 2. `SuspicionMeter.tsx` — "Was wir gefunden haben" → Spy-Bericht
- Header: **"🕵️ Spion-Bericht"** statt "Was wir gefunden haben" — mit SpyIcon (20px) statt Emoji
- Jeder Faktor als eigene mini-Card statt flache Liste:
  - Linker Rand: 3px farbiger Stripe (grün/gelb/rot)
  - Icon + `simpleLabel` in `0.875rem font-semibold`
  - Kein Emoji-Dot, stattdessen der farbige Stripe als Indikator
- `space-y-2` zwischen den Faktor-Cards
- Gesamte Section in einer `native-card` mit `p-4`

#### 3. Translations
- `simple.what_we_found` → de: "Spion-Bericht" / en: "Spy Report"
- Oder neuer Key `suspicion.spy_report`

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `SuspicionGauge.tsx` | SVG-Halbkreis → voller Circle-Ring, cleaner Score-Display |
| `SuspicionMeter.tsx` | Faktor-Liste → gestylte Mini-Cards mit farbigem Seitenstreifen, SpyIcon im Header |
| `de.json`, `en.json` | `suspicion.spy_report` Key |

### Visuelles Ziel
```text
┌──────────────────────────┐
│      ╭───────────╮       │
│     ╱  ·  ·  ·  · ╲     │  ← dünner Kreis-Ring (grün)
│    │      15       │     │  ← Score groß, zentriert
│    │  Verdachts-   │     │
│    │    Score       │     │
│     ╲  ·  ·  ·  · ╱     │
│      ╰───────────╯       │
│     😇 Alles sicher      │
└──────────────────────────┘

┌──────────────────────────┐
│  🕵️ Spion-Bericht        │
│                          │
│  ┃🟢 Hauptsächlich       │  ← grüner Seitenstreifen
│  ┃   Männer — normal     │
│                          │
│  ┃🟡 Normale Aktivität   │  ← gelber Seitenstreifen
│                          │
│  ┃🟢 Keine Follow/       │
│  ┃   Unfollow-Spielchen  │
│                          │
│  ┃🔴 Viel Nachtaktivität │  ← roter Seitenstreifen
└──────────────────────────┘
```


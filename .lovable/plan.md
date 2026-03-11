

## SpyStatusCard Redesign -- Cleaner, Bigger Spy, Circle-Chart Ring

### Konzept

Die Karte wird komplett umstrukturiert zu einem cleanen, zentrierten Layout:

1. **Titel oben**: "Deine Spy-Analyse" als einfacher Text-Header uber der Karte (nicht in der Karte)
2. **Grosser SpyIcon zentriert** (~80px) im Kreis-Ring, der Ring selbst IST das Diagramm (Score von 0-100 als Kreisfortschritt) -- wie ein Donut-Chart um den Spy herum
3. **Ring-Farbe = Level-Farbe**, Hintergrund-Ring dezent
4. **Darunter**: Level-Label + Score als kompakte Zeile, z.B. "Gelassen 😌 · 0/100"
5. **Darunter**: Kurzer Info-Text (descMap) als muted-foreground
6. **CTA-Pill**: "Analyse anzeigen >" in solidem Pink (gleicher Stil wie "Folgt neu"-Button -- `bg-primary text-primary-foreground`)
7. **Level-Segmente entfernen** -- der Ring visualisiert den Score bereits
8. **Pink-Header-Bar entfernen** -- stattdessen sauberer `native-card`-Hintergrund mit primary border
9. **Mehr Padding** (`my-4` statt `mb-2`) um Abstand zu anderen Sections

### Layout (vertikal zentriert)

```text
     Deine Spy-Analyse          <- Section title, outside card
  ┌─────────────────────────┐
  │                         │
  │      ╭── ring ──╮       │   <- Score-Ring (120px) als Kreisdiagramm
  │      │  🕵️ big  │       │      SpyIcon 64px zentriert
  │      ╰──────────╯       │
  │                         │
  │    Gelassen 😌 · 0/100  │   <- Level + Score
  │  Sammelt gerade Daten…  │   <- Status-Beschreibung
  │                         │
  │   [ Analyse anzeigen > ]│   <- Solid pink pill button
  │                         │
  └─────────────────────────┘
```

### Aenderungen in `src/components/SpyStatusCard.tsx`

- **Ring vergroessern**: `ringSize = 120`, `strokeWidth = 6`, SpyIcon `size={64}`
- **Layout zentrieren**: Alles `flex flex-col items-center text-center`
- **Pink-Header entfernen**: Kein separater Header-Bereich mehr
- **Level-Segmente (4 Balken) entfernen**: Ring genuegt als Visualisierung
- **Info/Chevron** in den Card-Body integrieren (Info-Icon oben rechts, dezent)
- **CTA-Pill solid pink**: `bg-primary text-primary-foreground` statt transparent
- **Section title** "Deine Spy-Analyse" als `text-sm font-bold` ueber der Karte
- **Padding**: `my-4` um die gesamte Sektion, `p-6` im Card-Body
- **Karten-Hintergrund**: `native-card` Style mit `border border-primary/20`

### Betroffene Dateien
- `src/components/SpyStatusCard.tsx`


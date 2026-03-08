

## Plan: SpyAgentCard kompakt & horizontal neu gestalten

### Problem
- Karte ist viel zu hoch (vertikal gestapelt: Title → Spy-Icon groß zentriert → Profil-Strip → Footer = 4 Ebenen)
- Grüne "LIVE" und "Stündliche Überwachung" Elemente passen farblich nicht zum Pink-Theme
- Account und Spy-Icon sind nicht nebeneinander → Drag-Distanz zu den Profilen darunter ist zu groß
- Zu viele unnötige Elemente (Radio-Icon, separate Title-Bar, separater Footer)

### Neues Layout: Kompakt, breit, horizontal

```text
┌─────────────────────────────────────────────┐
│                                             │
│  ┌──────────┐                 ┌──────────┐  │
│  │ Avatar   │                 │ SpyIcon  │  │
│  │  56px    │    · · · ·      │  64px    │  │
│  │ gradient │    pulsing      │  glow    │  │
│  │  ring    │    dots         │  drag    │  │
│  └──────────┘                 └──────────┘  │
│  @username        SPY COMMAND CENTER        │
│  7.7K · 1.1K     🔴 Überwachung aktiv      │
│                                             │
└─────────────────────────────────────────────┘
```

**Eine einzige kompakte Zeile** — alles nebeneinander, breiter als hoch.

### Änderungen in `src/components/SpyAgentCard.tsx`

1. **Entfernen**: Title-Bar oben ("SPY COMMAND CENTER" + LIVE), separater Footer mit grünem Dot + Radio-Icon, den ganzen "Monitored Profile Strip" als extra Button-Block

2. **Neues Layout** — ein `flex items-center` Row mit Padding `px-5 py-4`:
   - **Links**: Avatar (56px) mit Gradient-Ring, darunter `@username` + Stats (kompakt)
   - **Mitte**: 3 animierte Dots als Verbindung (pink, nicht grün!)
   - **Rechts**: SpyIcon (64px) draggable mit Glow, darunter kleiner Text "Spy" + pulsierender pinker Dot "Aktiv"

3. **Farbschema**: Alles Pink-Töne, kein Grün. Status-Dot wird pink pulsierend statt grün. Text in `hsl(347 100% 75%)` Tönen.

4. **Tap-Verhalten**: Gesamte Karte (außer SpyIcon) → `/profile/{id}`, SpyIcon Tap → `/spy`

5. **Hintergrund bleibt**: Der dunkle burgundy Gradient passt gut, wird beibehalten

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | Komplett flaches horizontales Layout, unnötige Elemente raus, alles Pink statt Grün |


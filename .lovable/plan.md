

## Plan: SpyAgentCard komplett neu + visuelle Trennung von Profilkarten

### Problem (Screenshot-Analyse)
1. **SpyAgentCard und ProfileCards sehen identisch aus** — beides `card-pink` mit dem gleichen rosa Tint. Null Unterscheidung.
2. **SpyAgentCard ist zu klein** — nur eine Zeile mit Avatar + Dots + Spy-Icon, alles gequetscht.
3. **Alles verschmilzt** — Pink auf Pink auf Pink, keine Hierarchie.

### Lösung: 3 klare visuelle Zonen

```text
┌──────────────────────────────────────┐
│  Pink Gradient Header                │
│  Logo + "Hey ewcwe!"                 │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  ★ SPY COMMAND CENTER ★         ││
│  │                                  ││
│  │  ┌──────────┐    ┌────────────┐ ││
│  │  │ Avatar   │    │  SpyIcon   │ ││
│  │  │  80px    │····│   88px     │ ││
│  │  │ gradient │    │  glow+     │ ││
│  │  │  ring    │    │  pulse     │ ││
│  │  └──────────┘    └────────────┘ ││
│  │  @username                      ││
│  │  7.7K Follower · 1.1K Following ││
│  │  🟢 Stündliche Überwachung      ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘

  DEINE PROFILE  (section header)

  ┌──────────────────────────────────┐
  │ native-card (weiß/dunkel,       │
  │ KEIN Pink-Tint!)                 │
  │ @saif_nassiri  7.698 · 1.081    │
  │ ZULETZT GEFOLGT: [img][img]...  │
  └──────────────────────────────────┘
```

### Änderungen

#### 1. `src/components/SpyAgentCard.tsx` — Komplett neu
- **Viel größer**: Vertikales Layout statt horizontal gequetscht
- **Oben**: Titel "SPY COMMAND CENTER" mit SpyIcon (16px) daneben
- **Mitte**: Zwei große Elemente nebeneinander:
  - Links: Avatar **80px** mit dickem Gradient-Ring + Username + Stats darunter
  - Rechts: SpyIcon **88px** mit intensivem mehrschichtigem Glow + Pulse-Animation, draggable
  - Dazwischen: Animierte horizontale Verbindungslinie (5 pulsierende Dots)
- **Unten**: Grüner Status-Dot + "Stündliche Überwachung aktiv" + Chevron
- **Hintergrund**: Dunkler als bisher — `hsl(var(--primary) / 0.20)` mit `border: 1.5px solid hsl(var(--primary) / 0.35)` und stärkerem `backdrop-blur(24px)`. MUSS sich deutlich von den Profilkarten unterscheiden.
- **Kein `card-pink` Class** — eigener inline Style

#### 2. `src/components/ProfileCard.tsx` — Kein Pink mehr!
- Ersetze `card-pink` durch `native-card` — normaler Karten-Hintergrund (weiß im Light Mode, fast-schwarz im Dark Mode)
- Die Profilkarten sollen sich klar vom Spy-Element unterscheiden: neutral, clean, keine rosa Tönung
- Rest bleibt gleich (RectAvatar, Stats, etc.)

#### 3. `src/pages/Dashboard.tsx` — Pink Header bis unter Spy-Karte ziehen
- Pink Gradient Header bekommt `pb-28` statt `pb-12`, damit er bis unter die SpyAgentCard reicht
- SpyAgentCard sitzt mit `-mt-20` im Overlap-Bereich → die Karte "sitzt" auf dem pinken Header
- Mehr Abstand (`pt-10`) vor "DEINE PROFILE" Sektion

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | Komplett neu: größer, vertikaler, eigener starker Pink-Hintergrund |
| `ProfileCard.tsx` | `card-pink` → `native-card` (neutral, kein Pink) |
| `Dashboard.tsx` | Header verlängern, SpyCard overlap, mehr Abstand zu Profilen |


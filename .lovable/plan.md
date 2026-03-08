

## Plan: SpyAgentCard Bereich deutlich aufwerten

### Was ich im Screenshot sehe
Die Spy-Karte sitzt zwar im pinken Header-Overlap, aber der Hintergrund der Karte ist ein blasses Pink-auf-Pink — kaum Kontrast. Der Avatar ist zu klein, die Stats gehen unter, und die ganze Karte wirkt wie ein Fremdkörper statt wie das Herzstück der App.

### Neues Design-Konzept

**Hintergrund der Spy-Karte**: Statt transparentes Pink-auf-Pink → **solides dunkles Glas** mit starkem Kontrast zum pinken Header. Dunkler Hintergrund (`rgba(0,0,0,0.65)` mit `backdrop-blur(32px)`) + subtile pinke Border. Das hebt die Karte dramatisch vom Header ab.

**Layout vergrößert und besser strukturiert**:
```text
┌─────────────────────────────────────────┐
│  🕵️ SPY COMMAND CENTER                 │
│─────────────────────────────────────────│
│                                         │
│   ┌─────────┐              ┌────────┐  │
│   │ Avatar  │   · · · ·    │ SPY    │  │
│   │  80px   │   animated   │ 96px   │  │
│   │ gradient│   dots       │ glow   │  │
│   │  ring   │              │ pulse  │  │
│   └─────────┘              └────────┘  │
│   @saif_nassiri                         │
│   7.7K Follower  ·  1.1K Following     │
│                                         │
│  🟢 Stündliche Überwachung aktiv    ›   │
└─────────────────────────────────────────┘
```

### Änderungen

#### 1. `src/components/SpyAgentCard.tsx`
- **Hintergrund**: `rgba(0,0,0,0.65)` + `backdrop-blur(32px)` + `border: 1px solid rgba(255,255,255,0.1)` — dunkles Glas auf pinkem Header = maximaler Kontrast
- **Avatar**: 80px mit dickerem Gradient-Ring (4px)
- **SpyIcon**: 96px statt 88px, intensiverer dreischichtiger Glow
- **Username**: größer (1rem, bold), Stats darunter deutlicher (0.8125rem)
- **Mehr Padding**: `px-7 py-6` statt `px-6 py-5`
- **Connection Dots**: größer (5px/7px), stärker animiert
- **Footer**: etwas mehr Padding, größere Schrift

#### 2. `src/pages/Dashboard.tsx`
- Pink Header `pb-32` (statt `pb-28`) für mehr Overlap-Raum
- SpyWidget Container `-mt-24` (statt `-mt-20`) damit die Karte tiefer im Header sitzt
- Mehr Abstand nach unten vor "DEINE PROFILE"

### Betroffene Dateien
| Datei | Was |
|---|---|
| `SpyAgentCard.tsx` | Dunkler Glas-Hintergrund, größerer Avatar/Spy, mehr Padding, stärkerer Kontrast |
| `Dashboard.tsx` | Header-Padding und Overlap anpassen |


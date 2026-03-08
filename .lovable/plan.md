

## Plan: Komplettes Redesign der SpyAgentCard

### Aktuelles Problem
Die Spy-Karte ist langweilig: Spy-Icon links, Text rechts, alles flach und uninspiriert. Kein visueller "Wow"-Effekt. Der überwachte Account ist zu klein und geht unter.

### Neues Design-Konzept: "Surveillance Command Center"

Inspiriert von modernen Glassmorphism-Dashboards und Dark-UI-Monitoring-Apps. Die Karte wird zum visuellen Herzstück des Dashboards.

```text
┌─────────────────────────────────────────────┐
│  ┌─────────────────────┐   ┌─────────────┐  │
│  │  Avatar (72px)       │   │             │  │
│  │  ring gradient       │   │  SpyIcon    │  │
│  │  @username (bold)    │   │  (72px)     │  │
│  │  Follower · Following│   │  glow+pulse │  │
│  │                      │   │  draggable  │  │
│  └─────────────────────┘   └─────────────┘  │
│                                              │
│  ── Verbindungslinie (animated dots) ──────  │
│                                              │
│  🟢 Stündliche Überwachung aktiv    → Detail │
└─────────────────────────────────────────────┘
```

**Hintergrund**: Subtiler Gradient von `hsl(347 100% 59% / 0.08)` nach `hsl(347 100% 59% / 0.15)` mit einer animierten "Scan-Linie" (optionaler Effekt). Border mit `hsl(var(--primary) / 0.2)`.

### Datei: `src/components/SpyAgentCard.tsx`

**Layout-Änderungen (Spy assigned state):**

1. **Zwei-Spalten-Layout**: Links der überwachte Account, rechts der Spy
   - **Links**: Avatar (72px) mit gradient ring, `@username` fett darunter, Follower/Following als kompakte Stats
   - **Rechts**: SpyIcon (72px) mit intensivem Glow + Pulse-Animation, draggable

2. **Verbindungslinie** zwischen Account und Spy: Animierte gestrichelte Linie (CSS `border-dashed` mit `animation: dash`) oder 3 pulsierende Dots als visueller Connector

3. **Footer-Zeile**: Grüner Dot + "Stündliche Überwachung aktiv" + ChevronRight für Navigation zum Profil. Gesamte Karte ist klickbar.

4. **Hintergrund**: Gradient `linear-gradient(135deg, hsl(347 100% 59% / 0.06), hsl(347 100% 59% / 0.14))` mit `backdrop-blur` Effekt und `border: 1px solid hsl(var(--primary) / 0.2)`

**Unassigned state:**
- Spy-Icon rechts (statt links), animiert mit Wobble
- Text links: "Ziehe den Spion auf ein Profil"

**Interaktion bleibt gleich**: Tap → `/spy`, Drag → Neuzuweisung

### Datei: `src/index.css`

Neue Keyframe-Animation für die Verbindungslinie:
```css
@keyframes spy-connection {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

### Betroffene Dateien
| Datei | Änderung |
|---|---|
| `src/components/SpyAgentCard.tsx` | Komplettes Redesign: Account links groß, Spy rechts groß, Verbindungslinie, Gradient-Hintergrund |
| `src/index.css` | Keyframe für Dot-Animation |


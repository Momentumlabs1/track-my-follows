

## Dashboard komplett neu gestalten – 3 klar getrennte Zonen

### Was der User will
1. **Oberer Bereich (Hero mit Name) soll PINK sein** – nicht grau, sondern ein helles/leuchtendes Pink als Hintergrund
2. **Spy-Überwachungsbereich komplett neu denken** – weg vom überladenen Rechteck mit "SPY ÜBERWACHT", "Aktiv", "Letzter Scan", "Nächster Scan" alles reingestopft. Minimalistischer, cleaner, mehr Luft
3. **Klare visuelle Trennung** zwischen Hero, Spy-Bereich und Profilliste

### Neues Layout-Konzept

```text
┌─────────── PINK GRADIENT HERO ────────────┐
│                                           │
│  🔍 SpySecret                             │
│                                           │
│  Hey ewcwe! ❤️                            │
│  Dein Spion ist aktiv.                    │
│                                           │
│         [🕵️ SPY ICON 100px]              │
│         @saif_nassiri                     │
│                                           │
└───────────── rounded-b-3xl ───────────────┘

    gap / Abstand (24px+)

  DEINE PROFILE

┌──────────── schwarz/dunkel ───────────────┐
│  [Avatar] @strichabi              >       │
│  ┌── Zuletzt gefolgt ───────────────────┐ │
└───────────────────────────────────────────┘
```

### Konkrete Änderungen

#### 1. `src/pages/Dashboard.tsx` – Hero wird Pink + Spy-Info integriert
- **Hero-Hintergrund**: Von `bg-card-elevated` zu einem echtem Pink-Gradient: `linear-gradient(180deg, hsl(347 100% 45%), hsl(347 80% 30%))` – leuchtendes, warmes Pink
- **Spy-Info IN den Hero integrieren** statt separater SpyAgentCard darunter:
  - Logo + Name oben
  - Greeting darunter
  - Großer SpyIcon (100px) zentriert mit dem überwachten Username darunter
  - Kein "SPY ÜBERWACHT" Label, kein "Aktiv" Badge, keine Scan-Zeiten – das ist die Detailseite
- **Mehr Padding**, mehr Luft (pb-10 statt pb-6)
- Spy-Icon bleibt draggable (tap → /spy, drag → reassign)
- Der `SpyAgentCard`-Wrapper in Zone 2 entfällt für Pro-User – alles ist im Hero

#### 2. `src/components/SpyAgentCard.tsx` – Wird zum reinen "Spy-Widget" innerhalb des Heroes
- Nur noch das draggable Spy-Icon + Avatar + Username rendern (kein Container, kein Background)
- Kein "SPY ÜBERWACHT" Header, kein "Aktiv" Badge, kein "Letzter/Nächster Scan"
- Unfollow-Hint bleibt als separates Element unter dem Hero (oder als Banner)

#### 3. Farbgebung
- Hero: Kräftiges Pink `hsl(347, 100%, 45%)` → `hsl(347, 80%, 25%)` Gradient (hell nach dunkel pink)
- Text im Hero: Weiß
- Profile darunter: Bleiben schwarz/dunkel wie bisher
- Großer Kontrast: Pink-Hero vs. schwarzer Rest

### Dateien
1. **`src/pages/Dashboard.tsx`** – Hero-Background auf Pink-Gradient, Spy-Content in Hero integrieren, Zone 2 vereinfachen
2. **`src/components/SpyAgentCard.tsx`** – Radikal vereinfachen: nur Icon + Avatar + Username, kein eigener Container/Background mehr


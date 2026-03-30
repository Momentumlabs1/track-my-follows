

## Plan: Immersives Push-Scan Erlebnis

### Problem
Aktuell: User drückt "Push Scan" → kleiner Spinner im Button → Toast "Scan complete" → fertig. Kein Feedback, keine Spannung, kein visuelles Erlebnis.

### Lösung: Fullscreen Scan-Overlay + Auto-Scroll zu Ergebnissen

```text
┌─────────────────────────┐
│  ┌───────────────────┐  │  Phase 1: Fullscreen Overlay (0-100%)
│  │   🕵️ SpyIcon      │  │  - Pulsierender SpyIcon mit Glow
│  │   "Scanning..."   │  │  - Animierte Fortschrittsanzeige
│  │   ████████░░ 72%  │  │  - Radar-Sweep Animation
│  │                   │  │  - Haptic Feedback bei Fortschritt
│  └───────────────────┘  │
│                         │  Phase 2: Ergebnis-Reveal (0.5s)
│  ┌───────────────────┐  │  - Overlay morpht zu Ergebnis-Card
│  │  ✨ 3 neue Follows │  │  - Konfetti/Partikel bei Fund
│  │  gefunden!        │  │  - Dramatischer Countdown 3→2→1
│  └───────────────────┘  │
│                         │  Phase 3: Auto-Navigation
│  → Scroll to Tabs ───── │  - Overlay faded out
│  → "Folgt neu" Tab ──── │  - Smooth-Scroll zur Following-Liste
│  → Neue Items pulsen ── │  - Neue Einträge kurz hervorgehoben
└─────────────────────────┘
```

### Neue Komponente: `src/components/ScanOverlay.tsx`

Fullscreen-Overlay mit drei Phasen:

**Phase 1 — Scanning (während API läuft)**
- Schwarzes/dunkles Fullscreen-Overlay mit Backdrop-Blur
- Grosser SpyIcon (120px) mit pulsierendem Glow-Ring
- Radar-Sweep-Animation (kreisförmiger Gradient der rotiert)
- Animierte Progress-Bar (simuliert 0→80% wie in AnalyzingProfile.tsx)
- Statustext wechselt: "Verbinde..." → "Scanne Followings..." → "Analysiere..."
- Haptic Ticks alle 20% Fortschritt

**Phase 2 — Ergebnis-Reveal (nach API-Response)**
- Progress springt auf 100%
- SpyIcon macht Scale-Bounce
- Ergebnis-Zahl zählt hoch (countUp Animation)
- Bei Funden: Grüner Glow + "X neue Follows gefunden!"
- Bei keinen Funden: Sanftes "Alles beim Alten ✓"
- Starker Haptic-Impact

**Phase 3 — Exit + Navigation (nach 1.5s)**
- Overlay faded smooth aus
- Wenn neue Follows gefunden: Auto-Scroll zum Tabs-Bereich
- "Folgt neu" Tab wird automatisch aktiviert
- Neue Events haben kurz einen leuchtenden Border-Pulse

### Änderungen in bestehenden Dateien

**`src/components/SpyStatusCard.tsx`**
- `handlePushScan`: Statt direkt Toast zu zeigen, öffnet es das ScanOverlay
- Neuer State: `scanOverlayOpen`, `scanResult`
- Scan-Ergebnis wird an Overlay übergeben
- Nach Overlay-Close: scrollt zu `#tabs-section` und setzt activeTab

**`src/pages/ProfileDetail.tsx`**
- Empfängt Callback von SpyStatusCard für Auto-Scroll + Tab-Switch
- `tabsRef` wird für `scrollIntoView({ behavior: 'smooth' })` genutzt (existiert bereits)
- Neue Events bekommen temporär eine CSS-Klasse für Highlight-Animation

**`src/index.css`**
- Neue Keyframes: `radar-sweep`, `glow-pulse`, `count-up-bounce`, `highlight-fade`

### Zusammenfassung

| Datei | Aktion |
|-------|--------|
| `src/components/ScanOverlay.tsx` | NEU — Fullscreen Scan-Animation |
| `src/components/SpyStatusCard.tsx` | EDIT — Overlay statt Toast |
| `src/pages/ProfileDetail.tsx` | EDIT — Auto-Scroll + Tab-Switch Callback |
| `src/index.css` | EDIT — Neue Animationen |

4 Dateien, 1 neu, 3 editiert. Kein Backend-Change.


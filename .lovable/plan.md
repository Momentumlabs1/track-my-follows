

# Unfollow-Check Button: Redesign mit Progress Bar, Erklärung & Funnel-Logik

## Aktueller Zustand
- Button zeigt "Unfollows prüfen" mit Shimmer-Effekt
- Scan-Animation: rotierende SpyIcon + indeterminate Ladebalken (bouncing) + 2 Phasen-Dots
- Ergebnis: einfache Karte (rot = Unfollows, grün = keine)
- Free-User sehen Lock-Button, der direkt Paywall triggert
- Keine Erklärung was der Scan tut, kein echtes Progress-Feedback

## Was verbessert wird

### 1. Pre-Scan Erklärung (Idle-State)
Statt nur ein Button: Eine kompakte Card mit Kontext
- Headline: "Unfollow-Scan" mit SpyIcon
- Subtext: "Prüft die gesamte Following-Liste auf Veränderungen seit dem letzten Scan"
- Darunter der CTA-Button
- Free-User: Teaser-Card mit Lock + "Was ist das?" Erklärung + Paywall-CTA

### 2. Scan-Animation mit echtem Progress Bar
- Determinate Progress Bar statt bouncing (geschätzt: 0-100% über ~30s)
- 3 Phasen statt 2: "Verbindung herstellen" → "Following-Liste scannen" → "Ergebnisse auswerten"
- Jede Phase hat Zeitschätzung und Checkmark wenn done
- Textlicher Hinweis: "Wir vergleichen alle Followings mit dem letzten Scan"

### 3. Ergebnis-State mit Überleitung
- Bei Unfollows: Karte mit rotem Alert + "Scrolle nach unten um Details zu sehen" CTA
- Bei keinen Unfollows: Grüne Bestätigung + "Nächster Scan in X Stunden" Info
- Neuer Follow-Count wird prominenter angezeigt
- Result bleibt 15s sichtbar statt 10s

### 4. Free-User Funnel
- Statt nur Lock-Icon: Mini-Preview zeigt "Was du mit Pro siehst"
- Fake-Scan-Preview: "3 mögliche Unfollows erkannt" (blurred) + CTA "Jetzt freischalten"
- Tap anywhere → Paywall mit Kontext "unfollows"

## Technische Umsetzung

### Datei: `src/components/UnfollowCheckButton.tsx` (komplett überarbeiten)

**State-Machine erweitern:**
```
type ScanPhase = "idle" | "connecting" | "scanning_following" | "evaluating" | "done";
```

**Progress-Berechnung:**
- `connecting`: 0-15% (0-3s)
- `scanning_following`: 15-70% (3-20s) 
- `evaluating`: 70-95% (20-30s)
- `done`: 100%
- Smooth interpolation mit `useEffect` + interval (100ms updates)

**Idle-State (Pro-User):**
- Native-card mit SpyIcon, Erklärungstext, Check-Count Badge, CTA Button

**Idle-State (Free-User):**
- Blurred Teaser-Card mit "3 Unfollows erkannt" (fake) + Lock-Overlay + "Pro freischalten" Button

**Scan-State:**
- Determinate Progress Bar (radix `<Progress>`) mit Prozent-Anzeige
- 3 Steps mit Check/Spinner/Dot Indikatoren
- Phase-Labels mit kurzer Erklärung

**Result-State:**
- Unfollows: rote Card + "↓ Details ansehen" Link-Button
- Keine Unfollows: grüne Card + checks remaining Badge
- +X neue Follows weiterhin als secondary Card

### Datei: `src/i18n/locales/de.json` + `en.json`
Neue Keys:
- `unfollow_check.description` - Erklärungstext
- `unfollow_check.phase_connecting` - Phase 1
- `unfollow_check.scroll_to_details` - CTA
- `unfollow_check.next_scan_info` - Nächster Scan
- `unfollow_check.teaser_title` - Free-User Teaser
- `unfollow_check.teaser_unlock` - CTA Free-User

### Keine Backend-Änderungen nötig
Alles rein Frontend/UI.


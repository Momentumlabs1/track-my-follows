

## Plan: Spy-Profil unten sortieren, Spy-Karte vergrößern, Suspicion-Indicator einbauen

### 1. Spy-Profil in der Account-Liste nach unten verschieben

In `src/pages/Dashboard.tsx` (Zeile ~364): Die `profiles`-Liste wird sortiert, sodass das Profil mit `has_spy === true` immer als letztes in der "Deine Accounts"-Liste erscheint. Einfaches `useMemo` mit Sort-Logik.

### 2. Spy-Karte (oben) vergrößern

- `minHeight` von `160px` auf `180px` erhöhen (Zeile ~203)
- Avatar-Größe von `48` auf `56` erhöhen
- Username-Font von `1.05rem` auf `1.15rem`
- "Spion angesetzt auf"-Label noch prominenter: `0.75rem`, `white/80`, etwas mehr Padding

### 3. Suspicion-Indicator in die Spy-Karte einbauen

In der weißen Profilkachel (links) wird unter den Follower-Zahlen ein kompakter Verdachtslevel-Indikator angezeigt:
- `analyzeSuspicion()` im Dashboard importieren und für das `spyProfile` berechnen
- Dafür die Follow-Events (`useFollowEvents`) und Profile-Followings (`useProfileFollowings`) für das Spy-Profil laden
- Anzeige: farbiger Dot + Score-Zahl + Label (z.B. "🟢 12% — Unauffällig" oder "🔴 78% — Sehr verdächtig")
- Farbe basiert auf dem Score: grün (<35), gelb (35-55), rot (>55)

### Dateien
- `src/pages/Dashboard.tsx` — alle drei Änderungen


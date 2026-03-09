

## Analyse & Plan

### 1. Suspicion-Indicator aus der Spy-Kachel entfernen

In `src/pages/Dashboard.tsx` Zeilen 276-305 wird der gesamte Suspicion-Indicator-Block entfernt. Die Imports (`analyzeSuspicion`, `useProfileFollowings`, `useFollowEvents` für Spy) und die zugehörigen `useMemo`/Hooks (Zeilen 4-6, 91-103) können ebenfalls entfernt werden, da sie nur für diesen Indicator genutzt werden — die Suspicion-Analyse bleibt auf der ProfileDetail-Seite vollständig erhalten.

### 2. Analyse aller Berechnungen

**Gender-Erkennung (`genderDetection.ts`) — Logisch solide:**
- 1.677 Namen (865 weiblich, 812 männlich) plus Ambiguous-Liste
- Nickname-Auflösung (Leni→Lena, Mike→Michael etc.)
- Suffix-Heuristik als Fallback (-ina, -ella = weiblich; -ovich, -us = männlich)
- **Potenzielles Problem**: Zeile 240 — Endung auf `-a` wird pauschal als weiblich gewertet. Das ist für europäische Namen korrekt, aber arabische/türkische Männernamen wie "Mustafa", "Hamza", "Isa" enden auf -a. Diese sind zwar in der MALE_NAMES-Liste und werden vorher abgefangen, aber unbekannte Namen mit -a-Endung aus diesen Kulturkreisen werden fälschlich als weiblich erkannt. **Risiko: mittel** — betrifft nur Namen, die nicht in der DB sind.

**Suspicion-Analyse (`suspicionAnalysis.ts`) — Logisch korrekt, aber Gewichtung diskutabel:**
- Gender-Ratio: max 40 Punkte (40% des Gesamtscores) — sehr dominant. Jemand der viele Frauen followed wird sofort als "verdächtig" eingestuft, auch wenn alles andere normal ist.
- Follow-Activity: max 30 Punkte — logisch sinnvoll. Rate = recentFollows/followingCount, misst relative Aktivität.
- Churn (Follow/Unfollow): max 15 Punkte — `churnRate = unfollows/follows` ist korrekt.
- Following/Follower-Ratio: max 10 Punkte — ratio > 3 = 10 Punkte, logisch.
- Night-Activity: max 5 Punkte — `nightRatio = nightFollows/recentFollows`, korrekt aber `recentFollows` bezieht sich auf die letzte Woche, `nightFollows` auf ALLE Events. **Bug**: `nightFollows` filtert nicht nach 7-Tage-Zeitraum, sondern zählt alle Follow-Events nachts. Sollte ebenfalls auf 7 Tage gefiltert werden.
- **Score-Kappung**: `Math.min(100, ...)` bei max 100 Punkten (40+30+15+10+5=100) — korrekt.
- **Label-Grenzen**: 0-15 "safe" 😇, 16-35 "safe" 😊, 36-55 "suspicious" 🤨, 56-75 "very suspicious" 😬, 76+ "Red Flag" 🚩 — logisch sinnvoll.

**`recentEvents`-Berechnung im Dashboard (Zeilen 105-111)** — wird berechnet aber nirgends im UI verwendet. Toter Code. Kann entfernt werden.

### 3. Zusammenfassung der Änderungen

**Datei: `src/pages/Dashboard.tsx`**
- Suspicion-Indicator (Zeilen 276-305) entfernen
- Ungenutzte Imports entfernen: `analyzeSuspicion`, `useProfileFollowings`, `useFollowEvents`
- Ungenutzte Hooks entfernen: `spyFollowEvents`, `spyFollowings`, `suspicion` useMemo, `recentEvents` useMemo
- `followerEvents` Hook bleibt falls anderswo genutzt — prüfen

**Datei: `src/lib/suspicionAnalysis.ts`** (optionaler Bugfix)
- Night-Activity Filter auf 7-Tage-Zeitraum anpassen (Zeile 140-144)


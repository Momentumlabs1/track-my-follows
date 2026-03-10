

## Analyse: Warum der Suspicion Score bei @timwger falsch ist

### Was du auf dem Screenshot siehst

- **Verdachts-Score: 30** — kommt NUR von "Sehr aktiv – 48 neue Follows in 7 Tagen!" (100%)
- **Geschlechterverhältnis: 0%** — obwohl er vielen Frauen folgt
- Alle anderen Faktoren: 0%

### Die 3 Bugs

#### Bug 1: Geschlechteranalyse ignoriert die Datenbank-Tags

Die `analyzeSuspicion`-Funktion berechnet das Geschlecht so:
```typescript
const gender = detectGender(name); // Client-side Name-Erkennung
```
Sie nutzt `detectGender()` auf dem **Display-Namen** — das ist die Client-seitige Namensliste mit 1.677 Namen. Aber: `profile_followings` hat bereits ein **`gender_tag`-Feld**, das vom Backend gesetzt wird (gleiche Logik, aber beim Scan berechnet).

**Das Problem:** Die Funktion ignoriert `gender_tag` komplett und erkennt viele Trading/Crypto/Business-Accounts nicht als weiblich/männlich, weil ihre Display-Namen keine erkennbaren Vornamen sind (z.B. "deepcharts.io", "ftmocom", "jamie.dahlkefx").

**Fix:** `analyzeSuspicion` soll zuerst `gender_tag` aus `profile_followings` verwenden. Nur als Fallback `detectGender(name)`.

#### Bug 2: Initial-Scan-Events werden als "neue Aktivität" gezählt

Nach dem Daten-Reset wurden alle 264 Followings neu gescannt. 48 davon haben ein `detected_at` innerhalb der letzten 7 Tage. Die Aktivitäts-Berechnung:
```typescript
const recentFollows = followEvents.filter((e) => {
  if (e.event_type !== "follow") return false;
  return Date.now() - new Date(e.detected_at).getTime() < 7 * 24 * 60 * 60 * 1000;
}).length; // → 48! Aber das sind Initial-Events, keine echten neuen Follows
```
Es gibt **keinen Filter auf `is_initial`**. Initial-Scan-Events (die beim ersten Scan als "bestehend" markiert werden) zählen als "neue Follows in 7 Tagen".

**Fix:** `is_initial === true` Events aus der Aktivitätsberechnung, Churn-Berechnung und Nachtaktivität ausschließen.

#### Bug 3: Ratio-Berechnung zeigt 0% trotz hoher Ratio

@timwger hat 264 Following / 4.200 Follower = Ratio 0.063. Das ist tatsächlich korrekt — er folgt weniger als er Follower hat, also normal. Kein Bug hier.

### So funktioniert die Berechnung (5 Faktoren, max 100 Punkte)

| Faktor | Max | Berechnung | Aktuell bei @timwger |
|--------|-----|-----------|---------------------|
| **Geschlechterverhältnis** | 40 | % weibliche Followings (>80%=40, >70%=30, >60%=20, >55%=10) | 0 — weil `detectGender` die meisten Namen nicht erkennt |
| **Follow-Aktivität** | 30 | Neue Follows in 7 Tagen / Gesamt-Followings (>10%=30, >5%=20, >2%=10) | 30 — weil 48 Initial-Events fälschlich gezählt werden (48/264 = 18%) |
| **Follow/Unfollow-Churn** | 15 | Unfollows / Follows in 7 Tagen (>50%=15, >30%=10) | 0 — keine Unfollows |
| **Following/Follower-Ratio** | 10 | Following÷Follower (>3=10, >2=7, >1.5=4) | 0 — 264/4200 = 0.06, sehr normal |
| **Nachtaktivität** | 5 | % Follows zwischen 23-5 Uhr in 7 Tagen | 0 |

### Konkrete Änderungen

**Datei: `src/lib/suspicionAnalysis.ts`**

1. **Gender-Fix:** Wenn `profileFollowings` verwendet wird, zuerst das `gender_tag`-Feld prüfen. Nur wenn `gender_tag` null/undefined ist, auf `detectGender(name)` zurückfallen.

2. **Initial-Events-Fix:** In allen zeitbasierten Filtern (Aktivität, Churn, Nachtaktivität) Events mit `is_initial === true` ausschließen. Die Signatur muss `is_initial` als optionales Feld im `followEvents`-Typ akzeptieren.

```typescript
// Beispiel für den Aktivitäts-Filter:
const recentFollows = followEvents.filter((e) => {
  if (e.event_type !== "follow") return false;
  if ((e as any).is_initial) return false; // ← NEU
  return Date.now() - new Date(e.detected_at).getTime() < 7 * 24 * 60 * 60 * 1000;
}).length;
```

### Erwartetes Ergebnis nach Fix

- **Gender:** Nutzt DB-Tags → erkennt korrekt, wie viele Frauen @timwger folgt
- **Aktivität:** Nur echte neue Follows nach dem Initial-Scan zählen → aktuell 0 (kein neuer Scan seit Reset)
- **Score:** Wird realistischer — steigt erst wenn echte neue Follows erkannt werden


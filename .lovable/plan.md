

## Problem: Falsche Entfolgungen durch unvollständige Baseline

### Root Cause

Die `create-baseline` hat 250 von 263 Following-Accounts in `profile_followings` geladen (wahrscheinlich nur Seite 1 bei der initialen Erstellung). Als dann der `unfollow-check` lief, hat er die **komplette** Following-Liste von Instagram geholt (263 Accounts) und mit der DB verglichen. Die 13 fehlenden Accounts aus der Baseline waren in der DB als `is_current=true` markiert, aber **nicht** in der API-Response enthalten — das System hat sie fälschlicherweise als "entfolgt" markiert.

**Beweis:** Alle 13 "Entfolgungen" haben exakt den gleichen `detected_at` Timestamp (`2026-03-12 19:00:32.531631`), alle `first_seen_at` der betroffenen `profile_followings` zeigen `2026-03-12 16:15:54` — das ist der Baseline-Zeitpunkt. Die Accounts waren nie wirklich in der DB-Baseline, sondern wurden beim `trigger-scan` (der nur Seite 1 scannt) gefunden und eingetragen. Beim `unfollow-check` waren sie dann plötzlich "weg", weil die Paginierung anders lief.

**Kern-Bug:** Der `unfollow-check` verwendet `v1/user/following/chunk` mit max 10 Seiten — das reicht für 263 Accounts locker. ABER: Die API gibt Accounts in **unterschiedlicher Reihenfolge** zurück zwischen verschiedenen Endpoints/Zeitpunkten. Accounts die beim Baseline oder `trigger-scan` auf Seite 1 erschienen, können beim `unfollow-check` auf einer anderen Seite sein und umgekehrt.

### Lösung

#### 1. Daten-Reparatur (SQL Migration)

Für `timwger` (Profil `c1fb4627-84bc-49f0-aac1-8b8846c64e7f`):
- Die 13 falschen `unfollow` Events aus `follow_events` löschen
- Die 13 `profile_followings` Einträge wieder auf `is_current=true` setzen
- `pending_unfollow_hint` auf 0 setzen

#### 2. Unfollow-Check Logik verbessern (`supabase/functions/unfollow-check/index.ts`)

**Problem:** Der Vergleich prüft nur "DB-Entry vorhanden aber nicht in API = entfolgt". Das ist falsch wenn die Baseline unvollständig war.

**Fix:** Vor dem Vergleich nur Einträge berücksichtigen, die **mindestens zweimal** gesehen wurden (d.h. `first_seen_at != last_seen_at`) ODER die nach dem `unfollow-check` eingefügt wurden. Einträge die nur einmal gesehen wurden (Baseline-only) sollten erst **bestätigt** werden:

- Beim `unfollow-check`: Accounts die in der API sind, aber `is_current=false` haben → wieder auf `is_current=true` setzen (Re-Confirmation)
- Accounts die im API sind und `is_current=true` haben → `last_seen_at` aktualisieren
- Nur Accounts als "entfolgt" markieren, die `is_current=true` UND `last_seen_at` nach dem Baseline-Zeitpunkt haben (also mindestens einmal bestätigt wurden)

**Alternativ (einfacher & sicherer):** Beim `unfollow-check` die `last_seen_at` aller gefundenen Accounts aktualisieren. Nur Accounts als entfolgt werten, deren `last_seen_at > first_seen_at` (= mindestens einmal bestätigt).

#### 3. UI-Fix: Entfolgt-Tab nur aktuell gültige zeigen

In `ProfileDetail.tsx`: Die `unfollowedByThem` Liste zusätzlich gegen `profile_followings.is_current` prüfen. Wenn ein Account wieder gefolgt wird (= `is_current=true`), soll er nicht mehr in der Entfolgt-Liste erscheinen.

Da wir aktuell keinen Join zwischen `follow_events` und `profile_followings` machen, ist die sauberste Lösung: Events die als `unfollow` markiert sind, aber deren `target_username` noch in der aktuellen Following-Liste ist, ausfiltern.

### Dateien

| Datei | Änderung |
|---|---|
| SQL Migration | Falsche Daten für timwger bereinigen |
| `supabase/functions/unfollow-check/index.ts` | `last_seen_at` Update + Bestätigungs-Logik |
| `src/pages/ProfileDetail.tsx` | Entfolgt-Filter gegen aktuelle Followings |


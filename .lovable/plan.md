

## Root Cause

In `unfollow-check/index.ts` Zeilen 492-526 gibt es diese Logik:

```
const maxNewFollows = lastFollowingCount !== null
  ? Math.max(actualFollowingCount - lastFollowingCount, 0)
  : 200;  // ← DAS IST DAS PROBLEM
```

Wenn `last_following_count` null ist (z.B. nach Baseline-Repair oder bei bestimmten Zuständen), werden bis zu **200 Kandidaten als echte "neue Follows"** behandelt statt als Backfill. Das heißt: Accounts, denen du vor Ewigkeiten gefolgt bist und die nur in der DB gefehlt haben, tauchen jetzt als "Folgt neu" auf mit `is_initial: false`.

Das ist genau was passiert ist — die 22 "neuen" Einträge sind keine echten neuen Follows, sondern Baseline-Lücken die fälschlich als Aktivität geloggt wurden.

## Fix

### 1) `maxNewFollows`-Fallback von 200 auf 0 ändern (`unfollow-check/index.ts`)
- Wenn `last_following_count` null/undefined ist → `maxNewFollows = 0` (alles ist Backfill)
- Damit werden neue Kandidaten nur als echte Follows gezählt, wenn wir eine verlässliche Vorher-Zahl haben
- Zusätzlich: nach Baseline-Repair `last_following_count` auf die reparierte Gesamtzahl setzen, damit der nächste Run eine Referenz hat

### 2) Gleichen Fix in `create-baseline/index.ts` prüfen/anwenden
- Sicherstellen dass `last_following_count` immer gesetzt wird wenn Baseline erstellt wird

### 3) Falsche Events aufräumen (DB-Bereinigung)
- Die 22 fälschlich als `is_initial: false` erstellten Events auf `is_initial: true` korrigieren, damit sie aus dem "Folgt neu"-Tab verschwinden und in "Vor Tracking" landen
- Query: `UPDATE follow_events SET is_initial = true WHERE tracked_profile_id = '6a060c46-...' AND event_type = 'follow' AND direction = 'following' AND is_initial = false AND detected_at > [Zeitpunkt des fehlerhaften Runs]`

### Betroffene Dateien
- `supabase/functions/unfollow-check/index.ts` — Zeile 496: `200` → `0`
- `supabase/functions/create-baseline/index.ts` — sicherstellen `last_following_count` gesetzt wird
- DB-Migration für Event-Korrektur


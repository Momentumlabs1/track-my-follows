

## Fix: Duplikate in follow_events & follower_events

### Problem
- `follow_events` und `follower_events` nutzen `.insert()` ohne Unique-Constraint
- Mehrere Scans erkennen denselben User als "neu" → mehrfach eingefügt
- @thevibefounder 4x, Follower-Events bis 10x dupliziert

### Lösung (3 Schritte)

**1. Migration: Duplikate bereinigen + Unique Indexes anlegen**

```sql
-- follow_events: Duplikate löschen (nur die älteste behalten)
DELETE FROM follow_events a USING follow_events b
WHERE a.id > b.id
  AND a.tracked_profile_id = b.tracked_profile_id
  AND a.target_username = b.target_username
  AND a.event_type = b.event_type
  AND a.direction = b.direction
  AND a.is_initial = b.is_initial;

-- follower_events: Duplikate löschen
DELETE FROM follower_events a USING follower_events b
WHERE a.id > b.id
  AND a.profile_id = b.profile_id
  AND a.username = b.username
  AND a.event_type = b.event_type
  AND a.is_initial = b.is_initial;

-- Unique Indexes (damit es nie wieder passiert)
CREATE UNIQUE INDEX uq_follow_event
  ON follow_events (tracked_profile_id, target_username, event_type, direction, is_initial);

CREATE UNIQUE INDEX uq_follower_event
  ON follower_events (profile_id, username, event_type, is_initial);
```

**2. Edge Functions: `.insert()` → `.upsert()` umstellen**

In `smart-scan/index.ts` und `trigger-scan/index.ts` alle `follow_events` und `follower_events` Inserts auf `.upsert(..., { onConflict: "...", ignoreDuplicates: true })` umstellen — exakt wie bereits bei `profile_followings` gemacht.

Betrifft:
- `smart-scan/index.ts`: 4 Stellen (Zeilen ~163, ~176, ~229, ~279)
- `trigger-scan/index.ts`: 4 Stellen (Zeilen ~130, ~183, ~227)

**3. Redeploy Edge Functions**

Nach dem Code-Update beide Functions deployen.

### Warum dieser Unique Key?
- `(tracked_profile_id, target_username, event_type, direction, is_initial)` — ein User kann nur einmal pro Event-Typ (follow/unfollow) als initial/non-initial existieren
- Wenn jemand entfolgt und re-followed, ist das ein anderer `event_type`
- **Einschränkung**: Wenn jemand tatsächlich 2x entfolgt und 2x re-followed, wird nur das erste Event gespeichert. Das ist akzeptabel — der Use Case ist extrem selten und die Alternative (endlose Duplikate) ist schlimmer.

### Reihenfolge
1. Migration zuerst (bereinigt + schützt)
2. Edge Function Code Update
3. Deploy


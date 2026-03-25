

## Fix: Fehlendes flipsefelix-Event + stilles Scheitern verhindern

### Problem
- `flipsefelix` wurde korrekt in `profile_followings` gespeichert (18:16:26)
- Aber das zugehörige `follow_event` (is_initial=false) wurde NIE erstellt
- Ursache: Der Scan lief mit dem alten Code (COALESCE im onConflict), der PostgREST-Upsert schlug lautlos fehl
- Der Code hat kein Error-Logging für `follow_events` und `follower_events` Upserts

### Lösung (2 Schritte)

**1. Migration: Fehlendes Event nachträglich einfügen**

```sql
INSERT INTO follow_events (tracked_profile_id, event_type, target_username, 
  target_avatar_url, target_display_name, detected_at, direction, 
  notification_sent, gender_tag, category, is_initial)
SELECT tracked_profile_id, 'follow', following_username, 
  following_avatar_url, following_display_name, first_seen_at, 'following',
  false, gender_tag, category, false
FROM profile_followings
WHERE tracked_profile_id = '6a060c46-4919-4d0f-8c18-a509c74d48ea'
  AND following_username = 'flipsefelix'
ON CONFLICT DO NOTHING;
```

**2. Edge Functions: Error-Logging für ALLE Upserts hinzufügen**

In `trigger-scan/index.ts` und `smart-scan/index.ts` — jeder `follow_events` und `follower_events` Upsert bekommt ein `.then(({ error }) => { if (error) console.warn(...) })`, genau wie es bei `profile_followings` schon gemacht wird.

Betrifft ca. 7 Stellen in beiden Files. Damit werden zukünftige Fehler sichtbar in den Logs.

**3. Redeploy beider Edge Functions**

Sicherstellen dass der aktuelle Code (mit korrektem onConflict ohne COALESCE) auch wirklich deployed ist.


-- follow_events: Duplikate löschen (nur die älteste behalten)
DELETE FROM follow_events a USING follow_events b
WHERE a.id > b.id
  AND a.tracked_profile_id = b.tracked_profile_id
  AND a.target_username = b.target_username
  AND a.event_type = b.event_type
  AND a.direction = b.direction
  AND a.is_initial IS NOT DISTINCT FROM b.is_initial;

-- follower_events: Duplikate löschen
DELETE FROM follower_events a USING follower_events b
WHERE a.id > b.id
  AND a.profile_id = b.profile_id
  AND a.username = b.username
  AND a.event_type = b.event_type
  AND a.is_initial IS NOT DISTINCT FROM b.is_initial;

-- Unique Indexes
CREATE UNIQUE INDEX uq_follow_event
  ON follow_events (tracked_profile_id, target_username, event_type, direction, COALESCE(is_initial, false));

CREATE UNIQUE INDEX uq_follower_event
  ON follower_events (profile_id, username, event_type, COALESCE(is_initial, false));
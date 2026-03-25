
-- 1. Set is_initial NOT NULL DEFAULT false on both tables
UPDATE follow_events SET is_initial = false WHERE is_initial IS NULL;
ALTER TABLE follow_events ALTER COLUMN is_initial SET NOT NULL, ALTER COLUMN is_initial SET DEFAULT false;

UPDATE follower_events SET is_initial = false WHERE is_initial IS NULL;
ALTER TABLE follower_events ALTER COLUMN is_initial SET NOT NULL, ALTER COLUMN is_initial SET DEFAULT false;

-- 2. Drop expression-based indexes
DROP INDEX IF EXISTS uq_follow_event;
DROP INDEX IF EXISTS uq_follower_event;

-- 3. Create plain column unique indexes
CREATE UNIQUE INDEX uq_follow_event ON follow_events (tracked_profile_id, target_username, event_type, direction, is_initial);
CREATE UNIQUE INDEX uq_follower_event ON follower_events (profile_id, username, event_type, is_initial);

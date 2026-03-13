
-- Repair false gained follower_events for saif_nassiri, timwger, lisa.jakobi
-- These were backfill artifacts from incomplete baselines, not real new followers
UPDATE follower_events 
SET is_initial = true 
WHERE event_type = 'gained' 
AND is_initial = false 
AND profile_id IN (
  'c1fb4627-84bc-49f0-aac1-8b8846c64e7f',
  '64c4865c-3806-43a7-93a1-224ef23b8e09',
  'f8bf4a3d-01e9-4b34-a23d-14303db82504'
);

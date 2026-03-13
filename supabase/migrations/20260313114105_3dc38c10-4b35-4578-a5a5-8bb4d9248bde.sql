
-- Repair false unfollow data for timwger (c1fb4627-84bc-49f0-aac1-8b8846c64e7f)
-- Delete 13 false unfollow events that all share the same timestamp
DELETE FROM follow_events 
WHERE tracked_profile_id = 'c1fb4627-84bc-49f0-aac1-8b8846c64e7f' 
AND event_type = 'unfollow' 
AND detected_at = '2026-03-12 19:00:32.531631+00';

-- Restore is_current for those 13 accounts
UPDATE profile_followings 
SET is_current = true, last_seen_at = now()
WHERE tracked_profile_id = 'c1fb4627-84bc-49f0-aac1-8b8846c64e7f'
AND is_current = false
AND following_username IN (
  'talha01_', 'martin.kovac76', 'sinii_92', 'jaafarsami_', 'philipp.pkt',
  'champ.0711', 'x_momo_x99', 'mariocaspari_', 'max__koenig', 'dawitxo',
  'alinablm', 'sophiechen.11', 'martinlaurentofficial'
);

-- Reset pending hint and correct total_unfollows_detected
UPDATE tracked_profiles 
SET pending_unfollow_hint = 0,
    total_unfollows_detected = GREATEST(COALESCE(total_unfollows_detected, 0) - 13, 0)
WHERE id = 'c1fb4627-84bc-49f0-aac1-8b8846c64e7f';

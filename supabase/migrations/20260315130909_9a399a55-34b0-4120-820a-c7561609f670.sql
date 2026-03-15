DELETE FROM follower_events WHERE profile_id = '4103d4f5-b301-456b-95c2-217135b980bf';
DELETE FROM profile_followers WHERE tracked_profile_id = '4103d4f5-b301-456b-95c2-217135b980bf';
UPDATE tracked_profiles SET last_follower_count = NULL, previous_follower_count = NULL, initial_scan_done = false WHERE id = '4103d4f5-b301-456b-95c2-217135b980bf';
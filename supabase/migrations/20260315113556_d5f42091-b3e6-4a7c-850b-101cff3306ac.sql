-- Clean up all follower data (all is junk from broken initial scans)
DELETE FROM follower_events;
DELETE FROM profile_followers;
DELETE FROM public.follower_events WHERE profile_id = '24030339-acad-4dd4-8141-6e7fd42af121';
DELETE FROM public.profile_followers WHERE tracked_profile_id = '24030339-acad-4dd4-8141-6e7fd42af121';
UPDATE public.tracked_profiles
SET initial_scan_done = false,
    last_follower_count = NULL
WHERE id = '24030339-acad-4dd4-8141-6e7fd42af121';
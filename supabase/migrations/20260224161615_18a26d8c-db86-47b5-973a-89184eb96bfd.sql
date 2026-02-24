-- New columns on follow_events
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS gender_tag TEXT DEFAULT 'unknown';
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS is_mutual BOOLEAN DEFAULT false;
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'normal';
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS target_follower_count INTEGER;
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS target_is_private BOOLEAN DEFAULT false;

-- Theme on user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- Initial scan tracking on tracked_profiles
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS initial_scan_done BOOLEAN DEFAULT false;

-- Push notification settings on user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS push_follows BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS push_unfollows BOOLEAN DEFAULT false;
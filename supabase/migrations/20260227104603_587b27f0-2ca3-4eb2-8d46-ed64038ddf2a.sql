
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT false;
ALTER TABLE public.follower_events ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT false;

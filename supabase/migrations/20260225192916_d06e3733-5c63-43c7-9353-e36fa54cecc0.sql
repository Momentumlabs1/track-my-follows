
-- Add baseline_complete to tracked_profiles for smart unfollow detection
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS baseline_complete BOOLEAN DEFAULT false;

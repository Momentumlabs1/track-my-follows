-- Add direction column to profile_followings to distinguish following vs follower tracking
ALTER TABLE public.profile_followings 
ADD COLUMN direction text NOT NULL DEFAULT 'following';

-- Add direction column to follow_events
ALTER TABLE public.follow_events 
ADD COLUMN direction text NOT NULL DEFAULT 'following';

-- Add index for efficient queries by direction
CREATE INDEX idx_profile_followings_direction ON public.profile_followings (tracked_profile_id, direction, is_current);
CREATE INDEX idx_follow_events_direction ON public.follow_events (tracked_profile_id, direction);
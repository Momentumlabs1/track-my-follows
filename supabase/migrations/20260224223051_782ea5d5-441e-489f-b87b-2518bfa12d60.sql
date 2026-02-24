
-- Create unfollow_checks table to track daily usage
CREATE TABLE public.unfollow_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_profile_id UUID NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  unfollows_found INTEGER DEFAULT 0,
  new_follows_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unfollow_checks ENABLE ROW LEVEL SECURITY;

-- Users can read their own checks
CREATE POLICY "Users read own unfollow checks"
  ON public.unfollow_checks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own checks  
CREATE POLICY "Users insert own unfollow checks"
  ON public.unfollow_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast daily count queries
CREATE INDEX idx_unfollow_checks_user_date 
  ON public.unfollow_checks (user_id, tracked_profile_id, created_at DESC);

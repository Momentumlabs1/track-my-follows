
-- Add Spy system columns to tracked_profiles
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS has_spy BOOLEAN DEFAULT false;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS spy_assigned_at TIMESTAMPTZ;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS last_following_count INTEGER;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS last_follower_count INTEGER;

-- Add spy_count to subscriptions for future Elite/Agency plans
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS spy_count INTEGER NOT NULL DEFAULT 1;

-- Function to move spy between profiles (ensures only 1 spy per user)
CREATE OR REPLACE FUNCTION public.move_spy(
  p_user_id UUID,
  p_new_profile_id UUID
) RETURNS void AS $$
BEGIN
  -- Remove spy from all user profiles
  UPDATE tracked_profiles
  SET has_spy = false, spy_assigned_at = NULL
  WHERE user_id = p_user_id AND has_spy = true;
  
  -- Assign spy to new profile
  UPDATE tracked_profiles
  SET has_spy = true, spy_assigned_at = now()
  WHERE id = p_new_profile_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

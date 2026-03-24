
-- 1. API Call Log table
CREATE TABLE IF NOT EXISTS public.api_call_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  function_name text NOT NULL,
  profile_id uuid REFERENCES public.tracked_profiles(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  status_code int,
  response_time_ms int,
  error_message text
);

-- Indexes for budget queries and profile lookups
CREATE INDEX IF NOT EXISTS idx_api_call_log_daily ON public.api_call_log (created_at);
CREATE INDEX IF NOT EXISTS idx_api_call_log_profile ON public.api_call_log (profile_id, created_at);

-- RLS: no client access, only service_role writes
ALTER TABLE public.api_call_log ENABLE ROW LEVEL SECURITY;

-- 2. New columns on tracked_profiles
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS last_scan_started_at timestamptz;
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS last_scan_function text;
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS last_baseline_attempt_at timestamptz;

-- 3. UNIQUE constraints (deduplicate first)
DELETE FROM public.profile_followings a
USING public.profile_followings b
WHERE a.id > b.id
  AND a.tracked_profile_id = b.tracked_profile_id
  AND a.following_user_id = b.following_user_id
  AND a.direction = b.direction;

ALTER TABLE public.profile_followings
  ADD CONSTRAINT uq_profile_following UNIQUE (tracked_profile_id, following_user_id, direction);

DELETE FROM public.profile_followers a
USING public.profile_followers b
WHERE a.id > b.id
  AND a.tracked_profile_id = b.tracked_profile_id
  AND a.follower_user_id = b.follower_user_id;

-- Only add constraint if follower_user_id is NOT NULL (some may be null)
-- Use a partial unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_follower
  ON public.profile_followers (tracked_profile_id, follower_user_id)
  WHERE follower_user_id IS NOT NULL;

-- 4. RPC for daily API call count
CREATE OR REPLACE FUNCTION public.get_daily_api_calls()
RETURNS int AS $$
  SELECT COUNT(*)::int FROM public.api_call_log
  WHERE created_at >= date_trunc('day', now());
$$ LANGUAGE sql STABLE;

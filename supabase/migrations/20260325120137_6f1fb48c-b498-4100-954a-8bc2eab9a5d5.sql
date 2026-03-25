-- Fix get_max_tracked_profiles to read from subscriptions table instead of stale profiles.plan_id
CREATE OR REPLACE FUNCTION public.get_max_tracked_profiles(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT s.max_tracked_profiles 
     FROM public.subscriptions s
     WHERE s.user_id = _user_id 
       AND s.status IN ('active', 'in_trial')
     LIMIT 1),
    (SELECT s.max_tracked_profiles
     FROM public.subscriptions s
     WHERE s.user_id = _user_id
       AND s.status IN ('expired', 'canceled')
       AND s.current_period_end > now()
     LIMIT 1),
    1
  );
$$;

-- Safety net: ensure all active pro subscriptions have correct max_tracked_profiles
UPDATE public.subscriptions 
SET max_tracked_profiles = 5 
WHERE plan_type = 'pro' 
  AND status IN ('active', 'in_trial')
  AND max_tracked_profiles IS DISTINCT FROM 5
  AND max_tracked_profiles < 9999;
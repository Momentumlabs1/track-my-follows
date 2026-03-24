
CREATE OR REPLACE FUNCTION public.get_daily_api_calls()
RETURNS int
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.api_call_log
  WHERE created_at >= date_trunc('day', now());
$$;

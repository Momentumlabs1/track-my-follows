
-- Create RPC function for account self-deletion
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.unfollow_checks WHERE user_id = auth.uid();
  DELETE FROM public.tracked_profiles WHERE user_id = auth.uid();
  DELETE FROM public.subscriptions WHERE user_id = auth.uid();
  DELETE FROM public.user_settings WHERE user_id = auth.uid();
  DELETE FROM public.profiles WHERE user_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;


INSERT INTO public.subscriptions (user_id, plan_type, status, max_tracked_profiles, spy_count)
VALUES ('8567fbe7-6e58-4c10-a626-9cc130e11c36', 'pro', 'active', 9999, 99)
ON CONFLICT (user_id) DO UPDATE SET
  plan_type = 'pro',
  status = 'active',
  max_tracked_profiles = 9999,
  spy_count = 99,
  updated_at = now();

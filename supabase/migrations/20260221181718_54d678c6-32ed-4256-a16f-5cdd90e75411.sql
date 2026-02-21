-- Create unlimited plan for testing
INSERT INTO public.subscription_plans (name, price_monthly, max_tracked_profiles)
VALUES ('unlimited', 0, 9999)
ON CONFLICT DO NOTHING;

-- Assign unlimited plan to test user
UPDATE public.profiles
SET plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'unlimited' LIMIT 1)
WHERE user_id = '0c0d03a0-6031-45f0-816b-78a48165eee5';
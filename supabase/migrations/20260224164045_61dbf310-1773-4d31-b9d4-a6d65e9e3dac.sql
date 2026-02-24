INSERT INTO subscriptions (user_id, plan_type, status, max_tracked_profiles, billing_period, current_period_end)
VALUES ('0c0d03a0-6031-45f0-816b-78a48165eee5', 'pro', 'active', 9999, 'yearly', '2099-12-31T23:59:59Z')
ON CONFLICT (user_id) DO UPDATE SET plan_type = 'pro', status = 'active', max_tracked_profiles = 9999, billing_period = 'yearly', current_period_end = '2099-12-31T23:59:59Z';
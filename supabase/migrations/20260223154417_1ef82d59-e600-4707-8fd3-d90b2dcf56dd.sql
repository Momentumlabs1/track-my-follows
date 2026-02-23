
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  billing_period TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  revenuecat_app_user_id TEXT,
  revenuecat_entitlement TEXT,
  store TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  max_tracked_profiles INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role (edge functions) can INSERT/UPDATE/DELETE

-- Create get_user_limits function
CREATE OR REPLACE FUNCTION public.get_user_limits(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_limits JSON;
BEGIN
  SELECT plan_type, status INTO v_plan, v_status
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'in_trial');

  IF v_plan IS NULL OR v_plan = 'free' THEN
    v_limits := '{"max_profiles": 1, "scan_interval_hours": 6, "unfollows": false, "push": false, "stats": false, "blur": true}'::JSON;
  ELSE
    v_limits := '{"max_profiles": 5, "scan_interval_hours": 1, "unfollows": true, "push": true, "stats": true, "blur": false}'::JSON;
  END IF;

  RETURN v_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-create free subscription for new users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status, max_tracked_profiles)
  VALUES (NEW.id, 'free', 'active', 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- Update updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 1. notification_sent column on follow_events
ALTER TABLE public.follow_events ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- 2. Previous counts on tracked_profiles for change tracking
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS previous_follower_count INTEGER;
ALTER TABLE public.tracked_profiles ADD COLUMN IF NOT EXISTS previous_following_count INTEGER;

-- 3. User settings table for timezone
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'Europe/Vienna',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

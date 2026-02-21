
-- ═══ Subscription Plans ═══
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  max_tracked_profiles INTEGER NOT NULL DEFAULT 1,
  price_monthly NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- Seed default plans
INSERT INTO public.subscription_plans (name, max_tracked_profiles, price_monthly) VALUES
  ('free', 1, 0),
  ('bestie', 3, 4.99),
  ('queen', 5, 9.99);

-- ═══ User Profiles ═══
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  plan_id UUID REFERENCES public.subscription_plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, plan_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    (SELECT id FROM public.subscription_plans WHERE name = 'free' LIMIT 1)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ Tracked Instagram Profiles ═══
CREATE TABLE public.tracked_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, username)
);

ALTER TABLE public.tracked_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: count tracked profiles for a user
CREATE OR REPLACE FUNCTION public.count_user_tracked_profiles(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.tracked_profiles
  WHERE user_id = _user_id AND is_active = true;
$$;

-- Helper: get max allowed profiles for a user
CREATE OR REPLACE FUNCTION public.get_max_tracked_profiles(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sp.max_tracked_profiles, 1)
  FROM public.profiles p
  JOIN public.subscription_plans sp ON sp.id = p.plan_id
  WHERE p.user_id = _user_id
  LIMIT 1;
$$;

CREATE POLICY "Users read own tracked profiles"
  ON public.tracked_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert tracked profiles within limit"
  ON public.tracked_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.count_user_tracked_profiles(auth.uid()) < public.get_max_tracked_profiles(auth.uid())
  );

CREATE POLICY "Users update own tracked profiles"
  ON public.tracked_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tracked profiles"
  ON public.tracked_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_tracked_profiles_updated_at
  BEFORE UPDATE ON public.tracked_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ Follow Events ═══
CREATE TABLE public.follow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_profile_id UUID NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('follow', 'unfollow')),
  target_username TEXT NOT NULL,
  target_display_name TEXT,
  target_avatar_url TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.follow_events ENABLE ROW LEVEL SECURITY;

-- Helper: check if user owns a tracked profile
CREATE OR REPLACE FUNCTION public.owns_tracked_profile(_user_id UUID, _tracked_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tracked_profiles
    WHERE id = _tracked_profile_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Users read own follow events"
  ON public.follow_events FOR SELECT
  USING (public.owns_tracked_profile(auth.uid(), tracked_profile_id));

CREATE POLICY "Users update own follow events"
  ON public.follow_events FOR UPDATE
  USING (public.owns_tracked_profile(auth.uid(), tracked_profile_id));

CREATE INDEX idx_follow_events_tracked_profile ON public.follow_events(tracked_profile_id);
CREATE INDEX idx_follow_events_detected_at ON public.follow_events(detected_at DESC);
CREATE INDEX idx_tracked_profiles_user_id ON public.tracked_profiles(user_id);

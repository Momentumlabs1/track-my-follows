
-- Table: follower_events (tracks gained/lost followers)
CREATE TABLE public.follower_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  profile_pic_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  follower_count INTEGER,
  event_type TEXT NOT NULL, -- 'gained' or 'lost'
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  gender_tag TEXT DEFAULT 'unknown',
  category TEXT DEFAULT 'normal'
);

ALTER TABLE public.follower_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own follower events"
  ON public.follower_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tracked_profiles
    WHERE tracked_profiles.id = follower_events.profile_id
      AND tracked_profiles.user_id = auth.uid()
  ));

CREATE INDEX idx_follower_events_profile_id ON public.follower_events(profile_id);
CREATE INDEX idx_follower_events_detected_at ON public.follower_events(detected_at DESC);

-- Table: profile_followers (baseline snapshot of current followers)
CREATE TABLE public.profile_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_profile_id UUID NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  follower_username TEXT NOT NULL,
  follower_user_id TEXT,
  follower_avatar_url TEXT,
  follower_display_name TEXT,
  follower_follower_count INTEGER,
  follower_is_verified BOOLEAN DEFAULT false,
  follower_is_private BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.profile_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile followers"
  ON public.profile_followers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tracked_profiles
    WHERE tracked_profiles.id = profile_followers.tracked_profile_id
      AND tracked_profiles.user_id = auth.uid()
  ));

CREATE INDEX idx_profile_followers_tracked ON public.profile_followers(tracked_profile_id, is_current);

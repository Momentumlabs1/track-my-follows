
-- Snapshot-Tabelle für Following-Vergleiche
CREATE TABLE public.profile_followings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracked_profile_id uuid NOT NULL REFERENCES public.tracked_profiles(id) ON DELETE CASCADE,
  following_username text NOT NULL,
  following_user_id text NOT NULL,
  following_avatar_url text,
  following_display_name text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true
);

-- Index für schnelle Lookups
CREATE INDEX idx_profile_followings_tracked_current 
  ON public.profile_followings(tracked_profile_id, is_current);

CREATE INDEX idx_profile_followings_user_id 
  ON public.profile_followings(following_user_id);

-- RLS aktivieren (Service Role only, keine User-Policies)
ALTER TABLE public.profile_followings ENABLE ROW LEVEL SECURITY;

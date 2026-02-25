
-- 1a) Neue Spalten in tracked_profiles
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS pending_unfollow_hint INTEGER DEFAULT 0;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS gender_female_count INTEGER DEFAULT 0;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS gender_male_count INTEGER DEFAULT 0;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS gender_unknown_count INTEGER DEFAULT 0;
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS gender_confidence TEXT DEFAULT 'unknown';
ALTER TABLE tracked_profiles ADD COLUMN IF NOT EXISTS gender_sample_size INTEGER DEFAULT 0;

-- 1b) Neue Spalten in profile_followings
ALTER TABLE profile_followings ADD COLUMN IF NOT EXISTS gender_tag TEXT;
ALTER TABLE profile_followings ADD COLUMN IF NOT EXISTS category TEXT;

-- 1c) DB-Funktionen für Gender-Count Updates
CREATE OR REPLACE FUNCTION increment_gender_count(p_profile_id UUID, p_gender TEXT)
RETURNS void AS $$
BEGIN
  IF p_gender = 'female' THEN
    UPDATE tracked_profiles SET gender_female_count = COALESCE(gender_female_count, 0) + 1 WHERE id = p_profile_id;
  ELSIF p_gender = 'male' THEN
    UPDATE tracked_profiles SET gender_male_count = COALESCE(gender_male_count, 0) + 1 WHERE id = p_profile_id;
  ELSE
    UPDATE tracked_profiles SET gender_unknown_count = COALESCE(gender_unknown_count, 0) + 1 WHERE id = p_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION decrement_gender_count(p_profile_id UUID, p_gender TEXT)
RETURNS void AS $$
BEGIN
  IF p_gender = 'female' THEN
    UPDATE tracked_profiles SET gender_female_count = GREATEST(COALESCE(gender_female_count, 0) - 1, 0) WHERE id = p_profile_id;
  ELSIF p_gender = 'male' THEN
    UPDATE tracked_profiles SET gender_male_count = GREATEST(COALESCE(gender_male_count, 0) - 1, 0) WHERE id = p_profile_id;
  ELSE
    UPDATE tracked_profiles SET gender_unknown_count = GREATEST(COALESCE(gender_unknown_count, 0) - 1, 0) WHERE id = p_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- FIX 1: RLS Policy for profile_followings
CREATE POLICY "Users can view own profile followings"
ON public.profile_followings
FOR SELECT
USING (
  tracked_profile_id IN (
    SELECT id FROM public.tracked_profiles WHERE user_id = auth.uid()
  )
);

-- FIX 3: Secure increment_gender_count with ownership check
CREATE OR REPLACE FUNCTION public.increment_gender_count(p_profile_id uuid, p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Security check: only own profiles or service_role
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM tracked_profiles
      WHERE id = p_profile_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  IF p_gender = 'female' THEN
    UPDATE tracked_profiles SET gender_female_count = COALESCE(gender_female_count, 0) + 1 WHERE id = p_profile_id;
  ELSIF p_gender = 'male' THEN
    UPDATE tracked_profiles SET gender_male_count = COALESCE(gender_male_count, 0) + 1 WHERE id = p_profile_id;
  ELSE
    UPDATE tracked_profiles SET gender_unknown_count = COALESCE(gender_unknown_count, 0) + 1 WHERE id = p_profile_id;
  END IF;
END;
$$;

-- FIX 3b: Secure decrement_gender_count with ownership check
CREATE OR REPLACE FUNCTION public.decrement_gender_count(p_profile_id uuid, p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Security check: only own profiles or service_role
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM tracked_profiles
      WHERE id = p_profile_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  IF p_gender = 'female' THEN
    UPDATE tracked_profiles SET gender_female_count = GREATEST(COALESCE(gender_female_count, 0) - 1, 0) WHERE id = p_profile_id;
  ELSIF p_gender = 'male' THEN
    UPDATE tracked_profiles SET gender_male_count = GREATEST(COALESCE(gender_male_count, 0) - 1, 0) WHERE id = p_profile_id;
  ELSE
    UPDATE tracked_profiles SET gender_unknown_count = GREATEST(COALESCE(gender_unknown_count, 0) - 1, 0) WHERE id = p_profile_id;
  END IF;
END;
$$;

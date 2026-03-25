-- Replace partial unique index with a full one so ON CONFLICT works
DROP INDEX IF EXISTS public.uq_profile_follower;
CREATE UNIQUE INDEX uq_profile_follower ON public.profile_followers (tracked_profile_id, follower_user_id);
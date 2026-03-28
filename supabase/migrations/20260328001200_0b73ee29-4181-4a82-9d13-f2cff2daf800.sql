-- Delete 16 false-positive unfollow events from timwger profile (all same timestamp from system update period)
DELETE FROM follow_events
WHERE tracked_profile_id = '1ac82f45-deba-44c6-b236-5b821c1ec1ff'
  AND event_type = 'unfollow'
  AND direction = 'following'
  AND detected_at = '2026-03-20 15:18:37.803+00';

-- Re-mark these users as current followings since the unfollows were false positives
UPDATE profile_followings
SET is_current = true
WHERE tracked_profile_id = '1ac82f45-deba-44c6-b236-5b821c1ec1ff'
  AND following_username IN ('alecasiraro','armina_xc','carlottacavazzii','claire.yozi','ke_hughes','maimounaalishadiallo','manuel.s.life','marianne.yehuda','mariaslinning','mbayonaa','sarahxroessler','sophia_jantz','sophiee.m','tommyydel','tompearson.01','ttianna.shefsky');
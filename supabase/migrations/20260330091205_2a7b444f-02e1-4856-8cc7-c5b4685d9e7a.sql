UPDATE follow_events fe
SET detected_at = pf.first_seen_at
FROM profile_followings pf
WHERE fe.tracked_profile_id = pf.tracked_profile_id
  AND fe.target_username = pf.following_username
  AND fe.direction = 'following'
  AND fe.event_type = 'follow'
  AND fe.is_initial = true
  AND pf.direction = 'following'
  AND fe.tracked_profile_id = '6a060c46-4919-4d0f-8c18-a509c74d48ea';
INSERT INTO follow_events (tracked_profile_id, event_type, target_username, target_avatar_url, target_display_name, detected_at, direction, notification_sent, gender_tag, category, is_initial)
SELECT tracked_profile_id, 'follow', following_username, following_avatar_url, following_display_name, first_seen_at, 'following', false, gender_tag, category, false
FROM profile_followings
WHERE tracked_profile_id = '6a060c46-4919-4d0f-8c18-a509c74d48ea'
  AND following_username = 'flipsefelix'
ON CONFLICT DO NOTHING;
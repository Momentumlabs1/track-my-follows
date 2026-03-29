-- Fix falsely flagged backfill events: mark as is_initial=true
-- These 18 events from 2026-03-29 16:00+ were baseline gaps, not real new follows
UPDATE follow_events 
SET is_initial = true 
WHERE tracked_profile_id = '6a060c46-4919-4d0f-8c18-a509c74d48ea' 
  AND event_type = 'follow' 
  AND direction = 'following' 
  AND is_initial = false 
  AND detected_at >= '2026-03-29 16:00:00+00';
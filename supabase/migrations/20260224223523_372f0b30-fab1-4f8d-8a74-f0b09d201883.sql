
-- Remove old cron job
SELECT cron.unschedule('auto-scan-hourly');

-- Create new cron job for smart-scan (every hour)
SELECT cron.schedule(
  'smart-scan-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bqqmfajowxzkdcvmrtyd.supabase.co/functions/v1/smart-scan',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcW1mYWpvd3h6a2Rjdm1ydHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MjIyNjcsImV4cCI6MjA4NzE5ODI2N30.3pTcOnNOFKCrv9VfzT5wTcUrMwuE2gPfGLG_jOQZwJ0"}'::jsonb,
    body := '{"triggered_by": "cron"}'::jsonb
  ) AS request_id;
  $$
);

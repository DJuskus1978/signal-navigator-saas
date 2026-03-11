
-- Schedule portfolio-snapshot to run twice daily during US market hours
-- 10:00 AM ET = 14:00 UTC (mid-morning update)
-- 4:30 PM ET = 20:30 UTC (market close update)

SELECT cron.schedule(
  'portfolio-snapshot-morning',
  '0 14 * * 1-5',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/portfolio-snapshot',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );$$
);

SELECT cron.schedule(
  'portfolio-snapshot-close',
  '30 20 * * 1-5',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/portfolio-snapshot',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );$$
);

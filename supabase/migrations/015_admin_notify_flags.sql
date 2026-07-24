-- Admin Telegram notifications: one-time flags so the bot notifies the admin
-- exactly once per user for "registered" and "installed the app" events.
alter table public.profiles
  add column if not exists registered_notified boolean not null default false,
  add column if not exists pwa_notified          boolean not null default false;

-- Backfill: existing users shouldn't trigger a burst of retroactive alerts.
update public.profiles set registered_notified = true where registered_notified = false;
update public.profiles set pwa_notified = true
  where pwa_notified = false and pwa_installed_at is not null;

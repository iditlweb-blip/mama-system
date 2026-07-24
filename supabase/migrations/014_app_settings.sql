-- Global app settings (key/value), used for feature toggles such as whether
-- the public products page is enabled. Writes happen only through the admin
-- (service_role) client, so there is no write policy for regular users.

create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

-- Anyone signed in may read settings (the products page checks the toggle).
drop policy if exists "app_settings_read" on app_settings;
create policy "app_settings_read" on app_settings
  for select using (true);

-- Seed the products toggle as OFF so the page starts as "coming soon".
insert into app_settings (key, value)
values ('products_enabled', 'false'::jsonb)
on conflict (key) do nothing;

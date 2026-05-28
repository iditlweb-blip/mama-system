-- Add baby gender and profile picture
alter table public.profiles
  add column if not exists baby_gender text check (baby_gender in ('boy', 'girl', null)),
  add column if not exists profile_picture_url text,
  add column if not exists business_name text,
  add column if not exists business_type text,
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists linkedin_url text,
  add column if not exists google_calendar_url text;

-- Vaccines / checkups table
create table if not exists public.health_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('vaccine', 'checkup', 'other')) not null,
  title text not null,
  scheduled_date date not null,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.health_events enable row level security;
create policy "Users manage own health_events" on public.health_events for all using (auth.uid() = user_id);

-- Weekly schedule table
create table if not exists public.weekly_schedule (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day_of_week integer check (day_of_week between 0 and 6) not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  type text check (type in ('work', 'baby', 'personal', 'break')) default 'work',
  created_at timestamptz default now()
);

alter table public.weekly_schedule enable row level security;
create policy "Users manage own weekly_schedule" on public.weekly_schedule for all using (auth.uid() = user_id);

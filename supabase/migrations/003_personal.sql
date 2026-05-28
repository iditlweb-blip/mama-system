-- Personal self-care activity logs
create table if not exists public.personal_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  title text not null,
  notes text,
  duration_min integer,
  created_at timestamptz default now()
);

alter table public.personal_logs enable row level security;

create policy "Users manage own personal_logs"
  on public.personal_logs for all
  using (auth.uid() = user_id);

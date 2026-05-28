-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  baby_name text,
  baby_birthdate date,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text check (category in ('work', 'home', 'baby')) not null,
  status text check (status in ('todo', 'inprogress', 'done')) default 'todo',
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  due_date date,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);

-- Baby logs table
create table public.baby_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('feed', 'sleep', 'diaper')) not null,
  feed_type text check (feed_type in ('breast', 'bottle', null)),
  amount_ml integer,
  duration_min integer,
  diaper_type text check (diaper_type in ('wet', 'dirty', 'both', null)),
  notes text,
  start_time timestamptz default now(),
  end_time timestamptz,
  created_at timestamptz default now()
);

alter table public.baby_logs enable row level security;
create policy "Users manage own baby_logs" on public.baby_logs for all using (auth.uid() = user_id);

-- Chat messages table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  mode text check (mode in ('baby', 'time', 'business', 'emotional')) default 'baby',
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
create policy "Users manage own chat_messages" on public.chat_messages for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

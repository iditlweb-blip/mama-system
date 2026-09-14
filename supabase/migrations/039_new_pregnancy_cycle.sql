-- Support starting a new pregnancy for a mother who already has a baby.
--
-- The whole app (tracker, dashboard, reminders, cron, the WhatsApp bot)
-- assumes exactly one active child/pregnancy per account, keyed only by
-- user_id - baby_logs and pregnancy_tests have no child reference at all.
-- Rather than teaching every one of those call sites about a child_id (a
-- much bigger change), a new pregnancy ARCHIVES the current child's rows out
-- of the live tables into mirror tables, so every existing query keeps
-- working unchanged and only ever sees the current cycle. Nothing is
-- deleted - `children` is a permanent record of who tracking used to be
-- about, and the archived_* tables hold what was actually logged for them.

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  tracking_type text not null check (tracking_type in ('pregnancy', 'baby')),
  name text,
  gender text,
  due_date date,
  birthdate date,
  archived_at timestamptz not null default now()
);

alter table public.children enable row level security;
create policy "Users manage own children" on public.children for all using (auth.uid() = user_id);

-- Mirror of baby_logs (whatever it has grown into over the migrations),
-- plus which archived child it belongs to.
create table if not exists public.archived_baby_logs (like public.baby_logs including all);
alter table public.archived_baby_logs
  add column if not exists child_id uuid references public.children(id) on delete cascade not null;
alter table public.archived_baby_logs
  add constraint archived_baby_logs_user_id_fkey foreign key (user_id) references auth.users on delete cascade;
alter table public.archived_baby_logs enable row level security;
create policy "Users manage own archived_baby_logs" on public.archived_baby_logs for all using (auth.uid() = user_id);

-- Same idea for pregnancy_tests - a fresh pregnancy starts with a clean
-- checklist instead of the previous pregnancy's completed/uploaded tests
-- still sitting there.
create table if not exists public.archived_pregnancy_tests (like public.pregnancy_tests including all);
alter table public.archived_pregnancy_tests
  add column if not exists child_id uuid references public.children(id) on delete cascade not null;
alter table public.archived_pregnancy_tests
  add constraint archived_pregnancy_tests_user_id_fkey foreign key (user_id) references auth.users on delete cascade;
alter table public.archived_pregnancy_tests enable row level security;
create policy "Users manage own archived_pregnancy_tests" on public.archived_pregnancy_tests for all using (auth.uid() = user_id);

-- One atomic move: archive the current baby's logs and tests, drop any
-- running sleep timer, and reset the profile to a blank pregnancy. Plain
-- invoker rights (no SECURITY DEFINER) - every statement only ever touches
-- rows the caller already owns under RLS, so there is no reason to elevate.
create or replace function public.start_new_pregnancy_cycle()
returns uuid
language plpgsql
as $$
declare
  v_user_id uuid := auth.uid();
  v_child_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.children (user_id, tracking_type, name, gender, birthdate)
  select id, 'baby', baby_name, baby_gender, baby_birthdate
  from public.profiles where id = v_user_id
  returning id into v_child_id;

  insert into public.archived_baby_logs
    select b.*, v_child_id from public.baby_logs b where b.user_id = v_user_id;
  delete from public.baby_logs where user_id = v_user_id;

  insert into public.archived_pregnancy_tests
    select t.*, v_child_id from public.pregnancy_tests t where t.user_id = v_user_id;
  delete from public.pregnancy_tests where user_id = v_user_id;

  delete from public.active_sleep_timers where user_id = v_user_id;

  update public.profiles set
    tracking_type      = 'pregnancy',
    due_date            = null,
    hospital_address    = null,
    baby_name            = null,
    baby_birthdate       = null,
    baby_gender          = null,
    has_given_birth      = false,
    birth_date           = null,
    birth_baby_name      = null,
    birth_baby_gender    = null,
    nap_dropped_band     = null
  where id = v_user_id;

  return v_child_id;
end;
$$;

grant execute on function public.start_new_pregnancy_cycle() to authenticated;

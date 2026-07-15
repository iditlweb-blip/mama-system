-- Add note + completion tracking to weekly schedule items
alter table public.weekly_schedule
  add column if not exists notes text,
  add column if not exists completed boolean default false;

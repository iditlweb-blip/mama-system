-- Back-office tables for the admin panel (internal to the app owner only).
-- All access goes through admin server actions using the service_role client,
-- which bypasses RLS. RLS is enabled with NO policies, so regular signed-in
-- users (anon / authenticated) can never read or write these rows.

-- ── App development tasks / roadmap ─────────────────────────────────────────
create table if not exists public.admin_tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  notes      text,
  status     text not null default 'todo',    -- 'todo' | 'doing' | 'done'
  priority   text not null default 'medium',  -- 'high' | 'medium' | 'low'
  sort_order int,
  created_at timestamptz not null default now()
);

-- ── Marketing content log (WhatsApp group + Instagram) ──────────────────────
create table if not exists public.admin_content (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null default 'whatsapp', -- 'whatsapp' | 'instagram'
  title          text,
  body           text not null,
  status         text not null default 'idea',     -- 'idea' | 'scheduled' | 'published'
  scheduled_date date,
  link           text,
  created_at     timestamptz not null default now()
);

-- ── Payments / running costs, with recurrence for the calculator ────────────
create table if not exists public.admin_payments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  amount     numeric not null default 0,
  currency   text not null default 'ILS',       -- 'ILS' | 'USD'
  recurrence text not null default 'monthly',   -- 'monthly' | 'yearly' | 'once'
  due_date   date,
  paid       boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.admin_tasks    enable row level security;
alter table public.admin_content  enable row level security;
alter table public.admin_payments enable row level security;
-- Intentionally no policies: only the service_role key (admin actions) passes.

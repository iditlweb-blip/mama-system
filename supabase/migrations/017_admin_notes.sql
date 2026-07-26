-- Free-form notes for the admin back-office (e.g. notes from the WhatsApp group).
-- Same security model as migration 016: RLS enabled with NO policies, so only the
-- service_role key (used by the admin server actions) can read or write.

create table if not exists public.admin_notes (
  id         uuid primary key default gen_random_uuid(),
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_notes enable row level security;
-- Intentionally no policies: only the service_role key (admin actions) passes.

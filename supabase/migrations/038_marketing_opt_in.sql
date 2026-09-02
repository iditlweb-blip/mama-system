-- Consent to receive app and community updates by email, taken at sign-up.
-- Opt-in only: the column defaults to false and is written from the checkbox
-- the mother ticked herself, never inferred. The timestamp records when she
-- agreed, which is what a consent record needs to be worth anything.
alter table profiles add column if not exists marketing_opt_in boolean default false;
alter table profiles add column if not exists marketing_opt_in_at timestamptz;

-- The admin mailing-list view reads this constantly; keep it cheap.
create index if not exists profiles_marketing_opt_in_idx
  on profiles (marketing_opt_in)
  where marketing_opt_in;

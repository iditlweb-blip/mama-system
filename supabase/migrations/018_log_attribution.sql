-- Log attribution + breastfeeding side.
-- feed_side: which breast a nursing session used ('left' | 'right' | 'both').
-- logged_by: which parent recorded the entry ('mom' | 'dad'), chosen by an
--            on-device toggle so both parents can share one login.
alter table public.baby_logs
  add column if not exists feed_side text,
  add column if not exists logged_by text;

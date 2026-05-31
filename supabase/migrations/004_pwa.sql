-- PWA install tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pwa_installed_at timestamptz;

COMMENT ON COLUMN public.profiles.pwa_installed_at IS 'When the user installed the PWA (added to home screen)';

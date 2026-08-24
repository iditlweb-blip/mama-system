-- Tracks whether an "ongoing sleep timer" notification is currently showing on
-- the mother's devices. The cron job sets it when it pushes the live timer
-- notification and clears it (with a dismiss push) once the timer is gone, so a
-- timer stopped from WhatsApp - or from a device that was offline - doesn't
-- leave a stale "still sleeping" notification sitting in the tray.
alter table profiles add column if not exists sleep_ongoing_notified boolean default false;

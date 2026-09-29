-- Registration form: replace Date of Birth with Age + Guardian Name.
-- Run once in the Supabase SQL editor BEFORE deploying the new code.

alter table public.rangavallika_registrations
  add column if not exists age integer,
  add column if not exists guardian_name text;

-- New registrations no longer send a date of birth.
-- Existing rows keep their dob value.
alter table public.rangavallika_registrations
  alter column dob drop not null;

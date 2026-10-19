-- ============================================================================
-- 0007 — Shifts, exceptions, slot blocks and booking channels
--
-- Phase 4 (CRM_MASTER_PLAN §7). Builds on 0001, which already closed the three
-- P0 defects (E7 exclusion constraint, E18 clinic timezone, E19 expiring soft
-- holds). What is still missing is the *shape* of the schedule itself:
--
--   * `doctor_schedules` allows exactly one row per (doctor_id, day_of_week),
--     so a doctor cannot run a morning and an evening shift.
--   * There is nowhere to record a holiday, leave, conference or an ad-hoc
--     extra shift (E20).
--   * There is nowhere to block a slice of the day (lunch, surgery) without
--     inventing a fake appointment.
--
-- Naming note: 0001 named the soft-hold column `appointments.expires_at`. The
-- plan text calls it `hold_expires_at`; the column is already live and wired
-- through the API, the availability read and the exclusion trigger, so this
-- migration keeps `expires_at` and does not rename it.
--
-- Every statement is idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`), so
-- re-running the file cannot alter an already-provisioned database.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. doctor_shifts — the multi-shift replacement for doctor_schedules.
--
-- `shift_name` separates two rows on the same day ("صباحي" / "مسائي"). Postgres
-- treats NULLs as distinct in a UNIQUE constraint, so the plain
-- UNIQUE(doctor_id, day_of_week, shift_name) would let a doctor create unbounded
-- unnamed shifts; the COALESCE index below closes that hole.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_shifts (
  id            TEXT PRIMARY KEY,
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id     TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 30,
  shift_name    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  max_overflow  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS doctor_shifts_unique_slot
  ON public.doctor_shifts (doctor_id, day_of_week, COALESCE(shift_name, ''));

CREATE INDEX IF NOT EXISTS doctor_shifts_doctor_day_idx
  ON public.doctor_shifts (doctor_id, day_of_week);

-- Seed from the legacy single-shift table so existing doctors keep their hours.
-- The legacy id is reused as the shift id, which makes the copy naturally
-- idempotent: a second run conflicts on the primary key and does nothing.
INSERT INTO public.doctor_shifts (
  id, clinic_id, doctor_id, day_of_week, start_time, end_time,
  slot_duration, shift_name, is_active
)
SELECT
  ds.id, ds.clinic_id, ds.doctor_id, ds.day_of_week, ds.start_time, ds.end_time,
  COALESCE(ds.slot_duration, 30), 'Default', COALESCE(ds.is_active, TRUE)
FROM public.doctor_schedules ds
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. schedule_exceptions — holidays, leave, conferences and extra shifts.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedule_exceptions (
  id             TEXT PRIMARY KEY,
  clinic_id      TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id      TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL
    CHECK (exception_type IN ('HOLIDAY', 'LEAVE', 'CONFERENCE', 'EXTRA_SHIFT')),
  reason         TEXT,
  start_time     TEXT,
  end_time       TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- An EXTRA_SHIFT needs both endpoints to generate slots; the others must not
-- carry hours that would be read as a real shift.
ALTER TABLE public.schedule_exceptions
  DROP CONSTRAINT IF EXISTS schedule_exceptions_extra_shift_hours;
ALTER TABLE public.schedule_exceptions
  ADD CONSTRAINT schedule_exceptions_extra_shift_hours
  CHECK (
    (exception_type = 'EXTRA_SHIFT' AND start_time IS NOT NULL AND end_time IS NOT NULL)
    OR (exception_type <> 'EXTRA_SHIFT' AND start_time IS NULL AND end_time IS NULL)
  );

CREATE INDEX IF NOT EXISTS schedule_exceptions_doctor_date_idx
  ON public.schedule_exceptions (doctor_id, exception_date);


-- ----------------------------------------------------------------------------
-- 3. slot_blocks — manual blocks that do not need a patient.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slot_blocks (
  id           TEXT PRIMARY KEY,
  clinic_id    TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id    TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  reason       TEXT,
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slot_blocks_doctor_date_idx
  ON public.slot_blocks (doctor_id, blocked_date);


-- ----------------------------------------------------------------------------
-- 4. appointments.booking_channel — where the booking came from (§7.2.4).
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS booking_channel TEXT NOT NULL DEFAULT 'MANUAL';

ALTER TABLE IF EXISTS public.appointments
  DROP CONSTRAINT IF EXISTS appointments_booking_channel_valid;
ALTER TABLE IF EXISTS public.appointments
  ADD CONSTRAINT appointments_booking_channel_valid
  CHECK (booking_channel IN ('MANUAL', 'WHATSAPP', 'PHONE', 'ONLINE', 'WALK_IN'));


-- ----------------------------------------------------------------------------
-- 5. RLS — tenants must not read each other's schedule configuration.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['doctor_shifts', 'schedule_exceptions', 'slot_blocks']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_clinic_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL '
      || 'USING (clinic_id::text = current_setting(''app.current_clinic_id'', true)) '
      || 'WITH CHECK (clinic_id::text = current_setting(''app.current_clinic_id'', true))',
      t || '_clinic_isolation', t
    );
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- 6. Appointment notifications (§7.6)
--
--    * patients.whatsapp_consent  — the opt-in that gates reminder messages.
--      The plan names a `patient_consents` table; the live schema has none, so
--      the minimal equivalent for scheduling purposes is a boolean on the
--      patient. Reminders must not fire without it; confirmations and
--      cancellations are transactional and always send when a phone exists.
--
--    * appointments.reminder_24h_sent_at / reminder_2h_sent_at — markers the
--      cron uses to make reminder delivery idempotent across runs.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.patients
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS appointments_reminder_24h_idx
  ON public.appointments (appointment_start)
  WHERE status IN ('SCHEDULED', 'CONFIRMED')
    AND reminder_24h_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS appointments_reminder_2h_idx
  ON public.appointments (appointment_start)
  WHERE status IN ('SCHEDULED', 'CONFIRMED')
    AND reminder_2h_sent_at IS NULL;

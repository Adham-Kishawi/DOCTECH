-- ============================================================================
-- 0001 — Real double-booking prevention + scheduling timezone + soft holds
--
-- Applies to the pre-existing `appointments` / `clinics` tables, which are not
-- covered by any DDL in this repository.
--
-- Three separate defects are fixed here:
--   E7   The only overlap check lives in application code
--        (lib/schedule/availabilityService.ts) and is a *read*. Two concurrent
--        bookings both pass it and both insert. A partial exclusion constraint
--        makes overlap impossible, not merely unlikely.
--   E18  Availability called `.getHours()` on a stored timestamp, which reads
--        the API server's zone (UTC), against wall-clock schedule hours that
--        belong to the clinic. Everything shifts by the offset.
--   E19  `PENDING_REVIEW` (AI booking requests) occupy a slot forever. They now
--        expire.
--
-- Section order matters: every column the overlap checks in sections 3 and 5
-- read is created in sections 1, 2 and 4.
-- ============================================================================

-- btree_gist lets an exclusion constraint mix an equality operator (doctor_id)
-- with a range overlap operator (&&). Shipped with PostgreSQL.
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ----------------------------------------------------------------------------
-- 1. Explicit start/end instants.
--
-- `date` alone is ambiguous: the duration is stored separately, so overlap math
-- needs both endpoints. Existing rows are backfilled from date + duration.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS appointment_start timestamptz,
  ADD COLUMN IF NOT EXISTS appointment_end   timestamptz;

-- COALESCE on both sides so a partially backfilled row (start set, end missing)
-- is repaired rather than left NULL and rejected by the NOT NULL below. Right-
-- hand sides always read the pre-update row, so this stays correct for both
-- the fresh and the half-applied case.
UPDATE public.appointments
SET appointment_start = COALESCE(appointment_start, date),
    appointment_end   = COALESCE(
      appointment_end,
      COALESCE(appointment_start, date) + make_interval(mins => COALESCE(duration, 30))
    )
WHERE appointment_start IS NULL
   OR appointment_end   IS NULL
   OR appointment_end   = appointment_start;

ALTER TABLE public.appointments
  ALTER COLUMN appointment_start SET NOT NULL,
  ALTER COLUMN appointment_end   SET NOT NULL;


-- ----------------------------------------------------------------------------
-- 2. PENDING_REVIEW soft holds (E19).
--
-- Created before section 3's trigger and section 5's constraint, both of which
-- read booking_status. Default 24h, matching the plan.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.appointments
SET expires_at = created_at + interval '24 hours'
WHERE booking_status = 'PENDING_REVIEW'
  AND expires_at IS NULL
  AND created_at IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 3. Keep the range in sync, and enforce the part of overlap that needs a
--    clock.
--
-- Both duties live in one trigger on purpose. PostgreSQL fires BEFORE triggers
-- in alphabetical order of trigger name, and an overlap check is meaningless
-- until the range has been filled in — splitting them into two triggers would
-- couple correctness to whatever the two names happen to sort as.
--
-- Runs BEFORE the exclusion constraint, so the constraint always sees a
-- complete range and cannot be bypassed by omitting appointment_end.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.doctech_sync_appointment_range()
RETURNS trigger AS $$
DECLARE
  clash public.appointments%ROWTYPE;
BEGIN
  IF NEW.appointment_start IS NULL THEN
    NEW.appointment_start := NEW.date;
  END IF;

  IF NEW.appointment_end IS NULL OR NEW.appointment_end = NEW.appointment_start THEN
    NEW.appointment_end := NEW.appointment_start
                           + make_interval(mins => COALESCE(NEW.duration, 30));
  END IF;

  -- A slot that is not being booked cannot be double-booked.
  IF NEW.status IS NULL OR NEW.status NOT IN ('SCHEDULED', 'CONFIRMED') THEN
    RETURN NEW;
  END IF;

  -- Serialise every appointment write for this doctor. The lock is held until
  -- the transaction ends, so a concurrent writer re-runs this check against
  -- whatever has been committed in the meantime. That is what closes the
  -- insert/insert window a read-then-write availability check cannot close,
  -- and it is why the expiry rule can be evaluated here rather than in the
  -- index below.
  PERFORM d.id FROM public.doctors d WHERE d.id = NEW.doctor_id FOR UPDATE;

  -- The expiry-sensitive half of the rule: an index predicate may only contain
  -- IMMUTABLE functions and `now()` is STABLE, so this half cannot live in the
  -- exclusion constraint in section 5.
  SELECT * INTO clash
    FROM public.appointments a
   WHERE a.id IS DISTINCT FROM NEW.id
     AND a.doctor_id = NEW.doctor_id
     AND a.status IN ('SCHEDULED', 'CONFIRMED')
     AND a.appointment_start < NEW.appointment_end
     AND a.appointment_end   > NEW.appointment_start
     AND (
       COALESCE(a.booking_status, '') <> 'PENDING_REVIEW'
       OR a.expires_at IS NULL
       OR a.expires_at > now()
     )
     AND (
       COALESCE(NEW.booking_status, '') <> 'PENDING_REVIEW'
       OR NEW.expires_at IS NULL
       OR NEW.expires_at > now()
     )
   LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'double booking: doctor % already holds % from % to %',
      NEW.doctor_id, clash.id, clash.appointment_start, clash.appointment_end
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_appointment_range ON public.appointments;
CREATE TRIGGER trg_sync_appointment_range
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.doctech_sync_appointment_range();


-- ----------------------------------------------------------------------------
-- 4. Clinic timezone (E18).
--
-- Availability must render and compare in the clinic's zone, not the server's.
-- ----------------------------------------------------------------------------
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Cairo';

ALTER TABLE IF EXISTS public.clinics DROP CONSTRAINT IF EXISTS clinics_timezone_iana;
-- Syntax only. The region/City part is optional so single-label IANA names
-- (UTC, Egypt, Israel, Japan, Zulu...) are accepted — the previous form
-- required a slash and rejected all of them. Real validity is enforced below.
ALTER TABLE IF EXISTS public.clinics
  ADD CONSTRAINT clinics_timezone_iana
  CHECK (timezone ~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+)*$');

-- The regex cannot tell "Africa/Cairo" from "Africa/Nowhere". An unrecognised
-- zone does not fail loudly: it throws a RangeError inside Intl.DateTimeFormat
-- and takes the availability endpoint down with it. Validate against the
-- server's own tz database so a bad value is rejected at write time instead.
CREATE OR REPLACE FUNCTION public.doctech_clinic_timezone_is_valid()
RETURNS trigger AS $$
BEGIN
  IF NEW.timezone IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'not a recognised timezone: %', NEW.timezone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clinic_timezone_is_valid ON public.clinics;
CREATE TRIGGER trg_clinic_timezone_is_valid
  BEFORE INSERT OR UPDATE OF timezone ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.doctech_clinic_timezone_is_valid();


-- ----------------------------------------------------------------------------
-- 5. The exclusion constraint: overlap is now rejected by PostgreSQL itself.
--
-- Partial (WHERE status IN ...): cancelled, completed and no-show appointments
-- must not block new bookings. The upper bound is exclusive ('[)'), so a
-- 10:00-10:30 and a 10:30-11:00 booking coexist back-to-back.
--
-- Soft holds are deliberately OUT of this constraint. An index predicate may
-- only contain IMMUTABLE functions and `now()` is STABLE, so Postgres refuses
-- the entire constraint with "functions in index predicate must be marked
-- IMMUTABLE" — leaving double-booking prevention switched off. The
-- expiry-sensitive half of the rule therefore lives in section 3's trigger;
-- what stays here is the half that needs no clock — two appointments that both
-- hold their slot outright must never overlap. Being index-backed, it holds
-- even if triggers are ever disabled.
--
-- Rebuildable: DROP + CREATE on every deploy so the definition never drifts.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.appointments DROP CONSTRAINT IF EXISTS no_doctor_overlap;
ALTER TABLE IF EXISTS public.appointments
  ADD CONSTRAINT no_doctor_overlap EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(appointment_start, appointment_end, '[)') WITH &&
  )
  WHERE (
    status IN ('SCHEDULED', 'CONFIRMED')
    AND COALESCE(booking_status, '') <> 'PENDING_REVIEW'
  );


-- ----------------------------------------------------------------------------
-- 6. Indexes for the availability read (one doctor, one day).
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_appointments_doctor_start;
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_start
  ON public.appointments (doctor_id, appointment_start)
  WHERE status IN ('SCHEDULED', 'CONFIRMED');

DROP INDEX IF EXISTS idx_appointments_clinic_start;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_start
  ON public.appointments (clinic_id, appointment_start);

DROP INDEX IF EXISTS idx_appointments_pending_expiry;
CREATE INDEX IF NOT EXISTS idx_appointments_pending_expiry
  ON public.appointments (clinic_id, expires_at)
  WHERE booking_status = 'PENDING_REVIEW';


-- ----------------------------------------------------------------------------
-- 7. RLS: tenants must not read each other's schedules.
--
-- The application uses the service-role key, which bypasses RLS; these policies
-- constrain any future anon/authenticated usage. `app.current_clinic_id` is set
-- per transaction by the caller.
-- ----------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS appointments_clinic_isolation ON public.appointments;
CREATE POLICY appointments_clinic_isolation ON public.appointments
  FOR ALL
  USING (clinic_id::text = current_setting('app.current_clinic_id', true))
  WITH CHECK (clinic_id::text = current_setting('app.current_clinic_id', true));
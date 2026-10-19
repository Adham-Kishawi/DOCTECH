-- ============================================================================
-- 0000 — Baseline schema
--
-- Converted from the retired `prisma/schema.prisma`, then CORRECTED against the
-- live database. Prisma was never wired up (no `prisma` scripts, no
-- `DATABASE_URL`, nothing imports `@prisma/client`), and the resulting drift was
-- real: Prisma still described `internal_messages.clinic_id` / `channel_id` /
-- `sender_name` and a TEXT primary key, none of which exist, and it omitted
-- `secretaries.phone` / `secretaries.permissions`. Every table below was checked
-- column-for-column and NOT NULL-for-NOT NULL against PostgREST's OpenAPI
-- document before this file was written, so this — not Prisma — is now the
-- authoritative description.
--
-- Scope: EVERY table this application reads or writes, so that applying
-- `supabase/migrations/*.sql` alone is enough to run the product. The seven
-- secondary tables (`reports`, `expenses`, `payment_transactions`,
-- `patient_attachments`, `notifications`, `whatsapp_conversations`,
-- `whatsapp_messages`) were previously declared only inside
-- app/api/admin/setup-doctech/route.ts, which needs a `POSTGRES_URL`; without
-- it the notifications and finance routes had no tables at all. They are
-- repeated here as `IF NOT EXISTS` so both paths stay idempotent and in sync.
--
-- Every statement is `IF NOT EXISTS`: on an already-provisioned database this
-- is a no-op and cannot alter live tables. It only takes effect in a fresh
-- environment, where previously nothing at all created these tables.
--
-- Column types follow the convention already used by setup-doctech: TEXT
-- identifiers and TEXT status columns with defaults rather than Postgres enum
-- types, so values can be extended without a DDL migration.
--
-- Intentionally does NOT include `clinics.timezone` or the
-- `appointments.appointment_start` / `appointment_end` / `expires_at` columns —
-- 0001 upgrades this baseline, and a migration that cannot apply its own
-- ALTERs would silently stop being exercised.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Tenants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  logo_url      TEXT,
  clerk_org_id  TEXT UNIQUE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctors (
  id             TEXT PRIMARY KEY,
  clerk_user_id  TEXT UNIQUE,
  email          TEXT UNIQUE,
  name           TEXT NOT NULL,
  specialty      TEXT,
  avatar_url     TEXT,
  clinic_id      TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.secretaries (
  id             TEXT PRIMARY KEY,
  clerk_user_id  TEXT UNIQUE,
  email          TEXT UNIQUE,
  name           TEXT NOT NULL,
  avatar_url     TEXT,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  clinic_id      TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  invited_at     TIMESTAMP WITH TIME ZONE,
  activated_at   TIMESTAMP WITH TIME ZONE,
  phone          TEXT,
  permissions    TEXT[] NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- Scheduling configuration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id             TEXT PRIMARY KEY,
  doctor_id      TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_id      TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week    INTEGER NOT NULL,
  start_time     TEXT NOT NULL,
  end_time       TEXT NOT NULL,
  slot_duration  INTEGER NOT NULL DEFAULT 30,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- The availability read is keyed by (doctor_id, day_of_week) and takes the
-- first row; without this it returns an arbitrary schedule.
CREATE UNIQUE INDEX IF NOT EXISTS doctor_schedules_doctor_day_key
  ON public.doctor_schedules (doctor_id, day_of_week);

CREATE TABLE IF NOT EXISTS public.appointment_types (
  id          TEXT PRIMARY KEY,
  clinic_id   TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  fee         DOUBLE PRECISION,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);


-- ----------------------------------------------------------------------------
-- Patients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  date_of_birth   TIMESTAMP WITH TIME ZONE,
  gender          TEXT NOT NULL DEFAULT 'UNKNOWN',
  address         TEXT,
  notes           TEXT,
  clinic_id       TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- Appointments
--
-- `appointment_start` / `appointment_end` / `expires_at` are added by 0001,
-- which also backfills them from `date` + `duration` and then installs the
-- exclusion constraint that makes double-booking impossible.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  TEXT PRIMARY KEY,
  patient_id          TEXT NOT NULL REFERENCES public.patients(id),
  doctor_id           TEXT NOT NULL REFERENCES public.doctors(id),
  secretary_id        TEXT REFERENCES public.secretaries(id),
  clinic_id           TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_type_id TEXT REFERENCES public.appointment_types(id),
  date                TIMESTAMP WITH TIME ZONE NOT NULL,
  duration            INTEGER NOT NULL DEFAULT 30,
  status              TEXT NOT NULL DEFAULT 'SCHEDULED',
  source              TEXT NOT NULL DEFAULT 'MANUAL',
  booking_status      TEXT NOT NULL DEFAULT 'APPROVED',
  type                TEXT,
  notes               TEXT,
  fee                 DOUBLE PRECISION,
  amount_paid         DOUBLE PRECISION DEFAULT 0,
  payment_method      TEXT,
  payment_date        TIMESTAMP WITH TIME ZONE,
  payment_notes       TEXT,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS appointments_clinic_date_idx
  ON public.appointments (clinic_id, date DESC);

CREATE INDEX IF NOT EXISTS appointments_doctor_date_idx
  ON public.appointments (doctor_id, date DESC);

CREATE INDEX IF NOT EXISTS appointments_patient_idx
  ON public.appointments (patient_id);


-- ----------------------------------------------------------------------------
-- Internal communication
--
-- Deliberately does NOT list `clinic_id`, `channel_id` or `sender_name`: the
-- live table does not have them. The application writes and filters on all
-- three (app/api/messages/route.ts, lib/dataService.ts), which makes those
-- queries fail with 42703 today — see 0002, which adds them.
--
-- `id` is UUID here, unlike every other table in this project (TEXT). Also
-- corrected by 0002 so the `msg-<ts>-<rand>` ids the app mints can be stored.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     TEXT REFERENCES public.doctors(id),
  secretary_id  TEXT REFERENCES public.secretaries(id),
  content       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sender_role   TEXT NOT NULL
);


-- ----------------------------------------------------------------------------
-- Reporting
--
-- Column-for-column mirror of the `ddlStatements` copy in
-- app/api/admin/setup-doctech/route.ts — keep both in sync.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id            TEXT PRIMARY KEY,
  patient_id    TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id     TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  triage_notes  TEXT,
  doctor_review TEXT,
  reply_method  TEXT,
  ai_reply      TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING',
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- Finance
--
-- `expenses.amount` / `payment_transactions.amount` are INTEGER piastres
-- (1 EGP = 100), not EGP floats: every total in the app is a sum, and sums of
-- DOUBLE PRECISION money are wrong. `appointments.fee` / `appointments.amount_paid`
-- stay EGP floats — they are single values, never summed, and converting them
-- would change every booking screen. See 0003 for the conversion of any
-- database where these two columns are still `double precision`.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id                TEXT PRIMARY KEY,
  clinic_id         TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id         TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  category          TEXT NOT NULL DEFAULT 'MISC',
  title             TEXT NOT NULL,
  title_ar          TEXT,
  amount            BIGINT NOT NULL,
  date              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  payment_method    TEXT NOT NULL DEFAULT 'CASH',
  paid_to           TEXT,
  receipt_no        TEXT,
  notes             TEXT,
  is_recurring      BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by_role  TEXT NOT NULL DEFAULT 'doctor',
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_clinic_date_idx
  ON public.expenses (clinic_id, date DESC);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                TEXT PRIMARY KEY,
  clinic_id         TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id         TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id        TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id    TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  type              TEXT NOT NULL DEFAULT 'CONSULTATION',
  amount            BIGINT NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'CASH',
  status            TEXT NOT NULL DEFAULT 'PAID',
  date              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes             TEXT,
  recorded_by_role  TEXT NOT NULL DEFAULT 'secretary',
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_transactions_clinic_date_idx
  ON public.payment_transactions (clinic_id, date DESC);


-- ----------------------------------------------------------------------------
-- Clinical attachments (Phase 5 wires them to Storage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_attachments (
  id             TEXT PRIMARY KEY,
  patient_id     TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_id      TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_url       TEXT NOT NULL,
  file_type      TEXT NOT NULL,
  description    TEXT,
  uploaded_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- Notifications
--
-- `role` / `title_ar` / `body_ar` are written by lib/serverNotifications.ts and
-- read by app/api/notifications/route.ts. They did not exist on the live table,
-- so every insert and every Arabic read failed — 0003 adds them to any
-- pre-existing copy of this table.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            TEXT PRIMARY KEY,
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id     TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  secretary_id  TEXT REFERENCES public.secretaries(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'all',
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  title_ar      TEXT,
  body          TEXT NOT NULL,
  body_ar       TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  link          TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- WhatsApp (Phase 7)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id               TEXT PRIMARY KEY,
  patient_id       TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id        TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  wa_id            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'OPEN',
  last_message     TEXT,
  last_message_at  TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  "from"          TEXT NOT NULL,
  content         TEXT NOT NULL,
  wa_message_id   TEXT,
  status          TEXT NOT NULL DEFAULT 'SENT',
  sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_idx
  ON public.whatsapp_messages (conversation_id, sent_at DESC);

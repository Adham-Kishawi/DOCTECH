-- ============================================================================
-- 0002 — internal_messages: tenant scoping + primary key type
--
-- Discovered while converting the retired `prisma/` schema into a baseline
-- migration (P0.5). This table was created outside this repository and never
-- caught up with what the application has always written, so three columns the
-- app uses do not exist and every query against the table fails at parse time:
--
--   app/api/messages/route.ts GET   .eq("clinic_id", clinicId)    -> 42703
--                                     -> caught, falls back to canned seed messages
--   app/api/messages/route.ts GET   .eq("channel_id", channelId)  -> 42703
--   app/api/messages/route.ts POST  INSERT clinic_id, channel_id,
--                                       sender_name               -> 42703 -> 500
--   app/api/messages/route.ts PATCH .eq("clinic_id", ...)         -> 42703
--   lib/dataService.ts              .eq("channel_id", ...)        -> 42703
--   app/[locale]/doctor/dashboard/page.tsx  (same query)
--
-- The INSERT also failed with 22P02: `id` is UUID while the app mints
-- `msg-<timestamp>-<random>`. Every other table in this project uses TEXT ids.
--
-- Net effect before this migration: the internal chat could neither read, write
-- nor mark-as-read, and a failed read was silently replaced with demo messages,
-- so the breakage was invisible to users. The table also had no tenant column
-- at all, which is incompatible with P0.3 — that work insists every tenant
-- scope comes from `session.clinicId` and nowhere else, and here there was
-- simply nothing to scope on.
--
-- Every statement is idempotent: `setup-doctech` runs this file on every call
-- and Postgres also no-ops `ALTER ... IF NOT EXISTS` / `CREATE INDEX IF NOT
-- EXISTS` on subsequent runs.
-- ============================================================================


-- 1. Align the primary key with the rest of the schema (TEXT), keeping the
--    values already stored. UUIDs convert losslessly to their text form.
ALTER TABLE public.internal_messages
  ALTER COLUMN id TYPE TEXT USING id::text;


-- 2. Add the columns the application reads and writes.
ALTER TABLE public.internal_messages
  ADD COLUMN IF NOT EXISTS clinic_id   TEXT,
  ADD COLUMN IF NOT EXISTS channel_id  TEXT,
  ADD COLUMN IF NOT EXISTS sender_name TEXT;


-- 3. Backfill `clinic_id`.
--
--    All 22 existing rows reference doctor_id = 'doc-101' and
--    secretary_id = 'sec-202', and neither of those rows exists in `doctors`
--    or `secretaries`. There is therefore no parent to inherit a clinic from,
--    so `clinic_id` remains NULL for every one of them.
--
--    That is the safe result, not a data loss. `.eq("clinic_id", $x)` never
--    matches NULL, so this orphaned test traffic becomes invisible to every
--    tenant instead of leaking across them.
UPDATE public.internal_messages m
   SET clinic_id = COALESCE(
         (SELECT d.clinic_id FROM public.doctors     d WHERE d.id = m.doctor_id),
         (SELECT s.clinic_id FROM public.secretaries s WHERE s.id = m.secretary_id))
 WHERE m.clinic_id IS NULL;


-- 4. Give legacy rows the default channel, so `.eq("channel_id", ...)` matches
--    them rather than excluding them as NULL.
UPDATE public.internal_messages
   SET channel_id = 'doctor_secretary_direct'
 WHERE channel_id IS NULL;


-- 5. Best-effort display name for legacy rows.
UPDATE public.internal_messages m
   SET sender_name = COALESCE(
         (SELECT d.name FROM public.doctors     d WHERE d.id = m.doctor_id),
         (SELECT s.name FROM public.secretaries s WHERE s.id = m.secretary_id))
 WHERE m.sender_name IS NULL;


-- 6. Indexes for the two read paths: tenant + channel ordered by time, and
--    channel-only ordered by time.
CREATE INDEX IF NOT EXISTS internal_messages_clinic_channel_sent_idx
    ON public.internal_messages (clinic_id, channel_id, sent_at);

CREATE INDEX IF NOT EXISTS internal_messages_channel_sent_idx
    ON public.internal_messages (channel_id, sent_at);

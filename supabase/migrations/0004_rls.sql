-- ============================================================================
-- 0004 — Deny-by-default database access (RLS)
--
-- Authentication here is Clerk, not Supabase Auth, so there is no
-- `auth.jwt()->>'sub'` to build a per-user policy on: any policy expression
-- would be a lie. What RLS *can* do, and what the app actually needs, is
-- close the one hole the app layer cannot see — an anon/publishable key
-- reaching PostgREST directly.
--
--   * Every public table gets RLS enabled and NO policy.
--   * `anon` and `authenticated` get no table privileges.
--   => direct REST reads and writes return zero rows / permission denied.
--
-- The product is unaffected: every route in app/api/ talks to Postgres
-- through `lib/supabaseAdmin.ts` (secret/service key), which bypasses RLS,
-- and every route already authenticates a session and scopes the query to
-- `session.clinicId` (lib/apiAuth.ts). RLS is the safety net under that, not
-- a substitute for it — a leaked publishable key now buys an attacker
-- nothing, and a missing `clinicId` filter fails closed instead of leaking
-- another tenant's rows.
--
-- Two guards keep this runnable anywhere:
--   * `to_regrole(...)` so a plain Postgres with no Supabase roles still works;
--   * `ALTER DEFAULT PRIVILEGES` so tables created later stop granting anon;
--   * the event trigger (wrapped in EXCEPTION) auto-enables RLS on tables
--     created after this file. If the executing role cannot create event
--     triggers, it is skipped with a NOTICE — every table that exists today
--     is already covered.
-- ============================================================================

DO $$
DECLARE
  tbl     text;
  has_sr  boolean := to_regrole('service_role') IS NOT NULL;
BEGIN
  FOR tbl IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Belt and braces: in Supabase the secret/service key is `service_role`,
    -- which carries BYPASSRLS and never reaches this policy. If the key is
    -- ever downgraded to a plain role, the explicit grant below keeps every
    -- server route working instead of failing closed on the app's own writes.
    IF has_sr THEN
      EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY "service_role_full_access" ON public.%I TO service_role USING (true) WITH CHECK (true)',
        tbl
      );
    END IF;

    RAISE NOTICE 'RLS enabled on public.%', tbl;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regrole('anon') IS NOT NULL AND to_regrole('authenticated') IS NOT NULL THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    RAISE NOTICE 'anon / authenticated lost table privileges';
  ELSE
    RAISE NOTICE 'no anon/authenticated roles — skipping privilege revoke';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'privilege revoke skipped: %', SQLERRM;
END $$;

DO $do$
BEGIN
  EXECUTE $event$
    CREATE OR REPLACE FUNCTION public.enable_rls_on_new_table() RETURNS event_trigger
    LANGUAGE plpgsql AS $fn$
    DECLARE
      tbl record;
    BEGIN
      FOR tbl IN
        SELECT c.relname
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relkind = 'r'
           AND NOT c.relrowsecurity
      LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.relname);
        BEGIN
          EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%I', tbl.relname);
          EXECUTE format(
            'CREATE POLICY "service_role_full_access" ON public.%I TO service_role USING (true) WITH CHECK (true)',
            tbl.relname
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'service_role policy skipped for public.%: %', tbl.relname, SQLERRM;
        END;
      END LOOP;
    END;
    $fn$;
    DROP EVENT TRIGGER IF EXISTS enable_rls_on_new_table;
    CREATE EVENT TRIGGER enable_rls_on_new_table
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION public.enable_rls_on_new_table();
  $event$;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'event trigger skipped (needs superuser): %', SQLERRM;
END
$do$;

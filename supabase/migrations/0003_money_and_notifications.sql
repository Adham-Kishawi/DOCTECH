-- ============================================================================
-- 0003 — Money as integer piastres + notification columns the app writes
--
-- Two independent corrections, both guarded so they are safe on any database
-- in any order:
--
-- 1. MONEY. `expenses.amount` and `payment_transactions.amount` were
--    `DOUBLE PRECISION` EGP. Every figure the product shows is a sum
--    (cash drawer, monthly P&L, profit margin, expense totals), and sums of
--    binary floats drift: 0.1 + 0.2 !== 0.3. The columns become BIGINT
--    piastres (1 EGP = 100) and conversion happens once, at the API boundary
--    (lib/money.ts), so no screen changes.
--
--    The conversion is wrapped in a type check: a database that already has
--    BIGINT (fresh, created by 0000 or by setup-doctech) must NOT be
--    multiplied by 100 again, and running this file twice must not double
--    convert either.
--
--    `appointments.fee` and `appointments.amount_paid` are deliberately left
--    as EGP floats: they are single values that are never summed, and every
--    booking screen reads them directly.
--
-- 2. NOTIFICATIONS. app/api/notifications/route.ts filters on `role` and reads
--    `title_ar` / `body_ar`; lib/serverNotifications.ts inserts all three. The
--    live table had none of them, so inserts failed with 42703 and Arabic
--    titles could never be read. The table itself may not exist yet (0000
--    creates it on a fresh database), hence the `to_regclass` guard.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'expenses'
      AND column_name  = 'amount'
      AND data_type    = 'double precision'
  ) THEN
    ALTER TABLE public.expenses
      ALTER COLUMN amount TYPE BIGINT USING ROUND(amount * 100);
    RAISE NOTICE 'expenses.amount converted DOUBLE PRECISION EGP -> BIGINT piastres';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payment_transactions'
      AND column_name  = 'amount'
      AND data_type    = 'double precision'
  ) THEN
    ALTER TABLE public.payment_transactions
      ALTER COLUMN amount TYPE BIGINT USING ROUND(amount * 100);
    RAISE NOTICE 'payment_transactions.amount converted DOUBLE PRECISION EGP -> BIGINT piastres';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'all';
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS title_ar TEXT;
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS body_ar TEXT;
    RAISE NOTICE 'notifications gained role / title_ar / body_ar';
  END IF;
END $$;

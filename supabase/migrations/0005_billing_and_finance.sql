-- ============================================================================
-- 0005 — Billing & finance foundation (Phase 2 of CRM_MASTER_PLAN §5)
--
-- Everything here is written to be re-runnable: CREATE TABLE IF NOT EXISTS,
-- ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, ON CONFLICT DO NOTHING.
--
-- Conventions inherited from 0000/0003:
--   * TEXT primary keys minted by the app (they carry meaning: "INV-2026-10-0042").
--   * Money is BIGINT piastres (1 EGP = 100). Never DOUBLE PRECISION.
--   * Enums are TEXT + CHECK: adding a value later is a metadata change, not
--     an ALTER TYPE ... ADD VALUE inside a transaction.
--   * Every table is clinic-scoped (clinic_id) — the app always filters on it.
--
-- Money rule for every table below: amounts are ALWAYS positive. Direction is
-- carried by an explicit column (direction, is_refund), never by a negative
-- number, so "SUM(amount)" never silently means two different things.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F1. expense_categories — hardcoded list becomes a table (plan §5.2.1)
--
-- clinic_id IS NULL marks a system category (seeded below). Clinics fork the
-- ones they need. is_clinical_cost is the field the P&L cannot work without:
-- supplies consumed per patient are COGS, office rent is not, and mixing them
-- makes net profit meaningless.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id                 TEXT PRIMARY KEY,
  clinic_id          TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  code               TEXT NOT NULL,
  name_en            TEXT NOT NULL,
  name_ar            TEXT NOT NULL,
  behavior_type      TEXT NOT NULL DEFAULT 'VARIABLE'
                       CHECK (behavior_type IN ('FIXED','SEMI_VARIABLE','VARIABLE','STEP_FIXED','CAPEX','TAX')),
  is_clinical_cost   BOOLEAN NOT NULL DEFAULT FALSE,
  is_patient_care    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order         INTEGER NOT NULL DEFAULT 100,
  parent_category_id TEXT REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  icon               TEXT,
  color              TEXT,
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, code)
);

-- The P&L reads behavior/is_clinical_cost per expense in one round trip.
CREATE INDEX IF NOT EXISTS expense_categories_clinic_idx
  ON public.expense_categories (clinic_id, is_active, sort_order);

-- Seed the system categories (clinic_id NULL). Ids are stable so the app can
-- reference them without a lookup. ON CONFLICT keeps a re-run harmless.
INSERT INTO public.expense_categories
  (id, clinic_id, code, name_en, name_ar, behavior_type, is_clinical_cost, is_patient_care, sort_order, icon, color)
VALUES
  ('cat_rent',      NULL, 'RENT',        'Clinic Rent',            'إيجار العيادة',              'FIXED',         FALSE, FALSE, 10, 'building', '#1A4B8C'),
  ('cat_salaries',  NULL, 'SALARIES',    'Salaries & Staff',       'المرتبات والأجور',           'FIXED',         FALSE, FALSE, 20, 'users',    '#6366F1'),
  ('cat_utilities', NULL, 'UTILITIES',   'Electricity & Utilities','الكهرباء والمياه',           'SEMI_VARIABLE', FALSE, FALSE, 30, 'zap',      '#F59E0B'),
  ('cat_supplies',  NULL, 'SUPPLIES',    'Medical Supplies',       'المستلزمات الطبية',          'VARIABLE',      TRUE,  TRUE,  40, 'package',  '#10B981'),
  ('cat_lab',       NULL, 'LAB',         'Laboratory & Tests',     'المعمل والتحاليل',           'VARIABLE',      TRUE,  TRUE,  50, 'flask',     '#8B5CF6'),
  ('cat_transport', NULL, 'TRANSPORT',   'Delivery & Transport',   'توصيل ومندوبين',             'VARIABLE',      FALSE, FALSE, 60, 'truck',     '#0EA5E9'),
  ('cat_maint',     NULL, 'MAINTENANCE', 'Maintenance & Repairs',  'الصيانة والتشغيل',           'STEP_FIXED',    FALSE, FALSE, 70, 'tool',      '#06B6D4'),
  ('cat_marketing', NULL, 'MARKETING',   'Marketing & Ads',        'التسويق والإعلان',           'STEP_FIXED',    FALSE, FALSE, 80, 'megaphone', '#EC4899'),
  ('cat_software',  NULL, 'SOFTWARE',    'Software & Subscriptions','البرامج والاشتراكات',       'FIXED',         FALSE, FALSE, 90, 'monitor',   '#64748B'),
  ('cat_taxes',     NULL, 'TAXES',       'Taxes & Licenses',       'الضرائب والتراخيص',          'TAX',           FALSE, FALSE, 110,'receipt',   '#EF4444'),
  ('cat_hospitality',NULL,'MISC',        'Petty Cash & Hospitality','نثريات وضيافة',             'VARIABLE',      FALSE, FALSE, 120,'coffee',    '#A16207'),
  ('cat_capex',     NULL, 'CAPEX',       'Equipment & Assets',     'أجهزة وأصول',                'CAPEX',         FALSE, FALSE, 130,'monitorCog','#475569')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- F2. expense_templates — the recurring-expense engine (plan §5.2.2)
--
-- This is what makes the README promise ("posted automatically every month")
-- true. posting_mode decides whether generation writes an expense outright
-- (AUTO) or parks it in pending_expenses for approval (CONFIRM).
-- last_posted_period (YYYY-MM) is the idempotency key: the same period can
-- never be posted twice, even if the runner is invoked ten times.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_templates (
  id                 TEXT PRIMARY KEY,
  clinic_id          TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  category_id        TEXT REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  title_en           TEXT NOT NULL,
  title_ar           TEXT NOT NULL,
  amount             BIGINT NOT NULL CHECK (amount >= 0),
  frequency          TEXT NOT NULL DEFAULT 'MONTHLY'
                       CHECK (frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','ANNUAL')),
  due_day_of_month   INTEGER CHECK (due_day_of_month BETWEEN 1 AND 31),
  weekday            INTEGER CHECK (weekday BETWEEN 0 AND 6),
  start_date         DATE,
  end_date           DATE,
  payment_method     TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
  payee              TEXT,
  contract_ref       TEXT,
  posting_mode       TEXT NOT NULL DEFAULT 'AUTO'
                       CHECK (posting_mode IN ('AUTO','CONFIRM','MANUAL')),
  accounting_basis   TEXT NOT NULL DEFAULT 'CASH'
                       CHECK (accounting_basis IN ('CASH','ACCRUAL')),
  last_posted_period TEXT,
  next_due_at        TIMESTAMP WITH TIME ZONE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expense_templates_clinic_active_idx
  ON public.expense_templates (clinic_id, is_active, next_due_at);

-- Approvals queue for posting_mode = 'CONFIRM'.
CREATE TABLE IF NOT EXISTS public.pending_expenses (
  id           TEXT PRIMARY KEY,
  clinic_id    TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  template_id  TEXT NOT NULL REFERENCES public.expense_templates(id) ON DELETE CASCADE,
  period_key   TEXT NOT NULL,
  amount       BIGINT NOT NULL CHECK (amount >= 0),
  status       TEXT NOT NULL DEFAULT 'PENDING'
                 CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  approved_by  TEXT,
  approved_at  TIMESTAMP WITH TIME ZONE,
  expense_id   TEXT REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, period_key)
);

-- ----------------------------------------------------------------------------
-- expenses — columns the P&L needs and the plan requires (§5.2.2)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    category_id           TEXT REFERENCES public.expense_categories(id) ON DELETE SET NULL;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    behavior_type_snapshot TEXT
      CHECK (behavior_type_snapshot IN ('FIXED','SEMI_VARIABLE','VARIABLE','STEP_FIXED','CAPEX','TAX'));
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    source_template_id    TEXT REFERENCES public.expense_templates(id) ON DELETE SET NULL;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    period_key            TEXT;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    expense_number        TEXT;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    invoice_ref           TEXT;
  ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS
    is_tax_deductible     BOOLEAN NOT NULL DEFAULT FALSE;

  IF to_regclass('public.expenses') IS NOT NULL THEN
    RAISE NOTICE 'expenses gained category/behavior/template/period columns';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS expenses_period_key_idx
  ON public.expenses (clinic_id, period_key);

-- is_recurring must never be typed in by a user: it is derived from whether a
-- template produced the row.
CREATE OR REPLACE FUNCTION public.expenses_derive_recurring()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_recurring := NEW.source_template_id IS NOT NULL;
  IF NEW.period_key IS NULL AND NEW.date IS NOT NULL THEN
    NEW.period_key := to_char(NEW.date AT TIME ZONE 'UTC', 'YYYY-MM');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_derive_recurring_trg ON public.expenses;
CREATE TRIGGER expenses_derive_recurring_trg
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_derive_recurring();

-- ----------------------------------------------------------------------------
-- Fixed cost breakdown (plan §5.2.3) — monthly amortized view of templates
-- used by the break-even calculation.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fixed_cost_breakdown (
  template_id       TEXT PRIMARY KEY REFERENCES public.expense_templates(id) ON DELETE CASCADE,
  clinic_id         TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  annual_amount     BIGINT NOT NULL CHECK (annual_amount >= 0),
  monthly_amortized BIGINT NOT NULL CHECK (monthly_amortized >= 0),
  variability_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- F6. invoices + invoice_items (plan §5.5.1) — replaces "an invoice is a line
-- of text inside an expense".
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id              TEXT PRIMARY KEY,
  clinic_id       TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id      TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id  TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  issue_date      DATE NOT NULL DEFAULT (NOW()::DATE),
  due_date        DATE,
  subtotal        BIGINT NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_type   TEXT NOT NULL DEFAULT 'NONE'
                    CHECK (discount_type IN ('NONE','PERCENTAGE','FIXED')),
  discount_value  BIGINT NOT NULL DEFAULT 0,
  discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount      BIGINT NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total           BIGINT NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid_amount     BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_due     BIGINT NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  status          TEXT NOT NULL DEFAULT 'ISSUED'
                    CHECK (status IN ('DRAFT','ISSUED','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED','REFUNDED')),
  notes           TEXT,
  created_by      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS invoices_clinic_date_idx
  ON public.invoices (clinic_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS invoices_patient_idx
  ON public.invoices (clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx
  ON public.invoices (clinic_id, status);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id                  TEXT PRIMARY KEY,
  invoice_id          TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  clinic_id           TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  item_type           TEXT NOT NULL DEFAULT 'OTHER'
                        CHECK (item_type IN ('CONSULTATION','PROCEDURE','LAB_TEST','MEDICATION','REPORT','OTHER')),
  description_ar      TEXT NOT NULL,
  description_en      TEXT,
  quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price          BIGINT NOT NULL CHECK (unit_price >= 0),
  line_total          BIGINT NOT NULL CHECK (line_total >= 0),
  appointment_type_id TEXT REFERENCES public.appointment_types(id) ON DELETE SET NULL,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx
  ON public.invoice_items (invoice_id);

-- ----------------------------------------------------------------------------
-- F8. discounts / coupons (plan §5.5.1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discounts (
  id            TEXT PRIMARY KEY,
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'PERCENTAGE'
                  CHECK (type IN ('PERCENTAGE','FIXED_AMOUNT','FREE_CONSULTATION')),
  value         BIGINT NOT NULL DEFAULT 0,
  applies_to    TEXT NOT NULL DEFAULT 'ALL'
                  CHECK (applies_to IN ('ALL','SPECIFIC_TYPES')),
  min_amount    BIGINT,
  max_uses      INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0,
  valid_from    DATE,
  valid_until   DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, code)
);

-- ----------------------------------------------------------------------------
-- F9. refunds (plan §5.5.3) — amount is ALWAYS positive; direction lives on
-- payment_transactions.is_refund.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
  id               TEXT PRIMARY KEY,
  clinic_id        TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  invoice_id       TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  transaction_id   TEXT REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  patient_id       TEXT REFERENCES public.patients(id) ON DELETE SET NULL,
  amount           BIGINT NOT NULL CHECK (amount > 0),
  reason           TEXT,
  method           TEXT NOT NULL DEFAULT 'CASH',
  refund_reference TEXT,
  approved_by      TEXT,
  approved_at      TIMESTAMP WITH TIME ZONE,
  created_by       TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refunds_clinic_date_idx
  ON public.refunds (clinic_id, created_at DESC);

DO $$
BEGIN
  ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS
    invoice_id TEXT REFERENCES public.invoices(id) ON DELETE SET NULL;
  ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS
    is_refund BOOLEAN NOT NULL DEFAULT FALSE;
END $$;

-- ----------------------------------------------------------------------------
-- F7. Concurrency-safe sequential numbering (plan §5.5.2)
--
-- MAX(x)+1 loses numbers under concurrency. This allocates one value per
-- (clinic, kind, month) inside a single atomic upsert, so two simultaneous
-- invoice writes can never receive the same number.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.counters (
  clinic_id  TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('INVOICE','EXPENSE')),
  period_key TEXT NOT NULL,
  last_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clinic_id, kind, period_key)
);

CREATE OR REPLACE FUNCTION public.next_counter_value(
  p_clinic_id TEXT,
  p_kind      TEXT,
  p_period_key TEXT
) RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v BIGINT;
BEGIN
  INSERT INTO public.counters (clinic_id, kind, period_key, last_value, updated_at)
  VALUES (p_clinic_id, p_kind, p_period_key, 1, NOW())
  ON CONFLICT (clinic_id, kind, period_key)
  DO UPDATE SET last_value = public.counters.last_value + 1,
                updated_at = NOW()
  RETURNING last_value INTO v;
  RETURN v;
END;
$$;

-- ----------------------------------------------------------------------------
-- F10. cash sessions (plan §5.7) — replaces `cashInDrawer` as a computed
-- number nobody can reconcile against.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id            TEXT PRIMARY KEY,
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  secretary_id  TEXT REFERENCES public.secretaries(id) ON DELETE SET NULL,
  opened_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMP WITH TIME ZONE,
  opening_float BIGINT NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  expected_cash BIGINT,
  actual_cash   BIGINT,
  variance      BIGINT,
  status        TEXT NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','CLOSED','RECONCILED')),
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One open drawer per clinic: a second OPEN session would split the day's
-- cash across two places nobody reconciles.
CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_idx
  ON public.cash_sessions (clinic_id) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id             TEXT PRIMARY KEY,
  cash_session_id TEXT NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  clinic_id      TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  direction      TEXT NOT NULL CHECK (direction IN ('IN','OUT')),
  amount         BIGINT NOT NULL CHECK (amount > 0),
  category       TEXT NOT NULL DEFAULT 'OTHER',
  reference_type TEXT,
  reference_id   TEXT,
  notes          TEXT,
  recorded_by    TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cash_movements_session_idx
  ON public.cash_movements (cash_session_id);

-- ----------------------------------------------------------------------------
-- RLS: 0004 installs an event trigger that covers tables created afterwards.
-- This block repeats the guarantee for databases where that trigger could not
-- be created (plain Postgres without superuser), so 0005 is safe either way.
-- ----------------------------------------------------------------------------
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
       AND c.relname IN (
         'expense_categories','expense_templates','pending_expenses',
         'fixed_cost_breakdown','invoices','invoice_items','discounts',
         'refunds','counters','cash_sessions','cash_movements'
       )
       AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    IF has_sr THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "service_role_full_access" ON public.%I', tbl);
      EXECUTE format(
        'CREATE POLICY "service_role_full_access" ON public.%I TO service_role USING (true) WITH CHECK (true)',
        tbl);
    END IF;
    RAISE NOTICE 'RLS enabled on public.%', tbl;
  END LOOP;
END $$;

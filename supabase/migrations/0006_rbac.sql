-- ============================================================================
-- 0006 — RBAC: granular permissions & roles (Phase 3 of CRM_MASTER_PLAN §6)
--
-- Re-runnable: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- ON CONFLICT DO NOTHING. No data is destroyed.
--
-- Design (plan §6.3):
--   * `permissions` is the system catalog (28 atomic capabilities). Stable
--     ids like `finance.profit`; the app treats them as opaque strings.
--   * `roles` are presets a doctor can assign. clinic_id IS NULL = system role.
--   * `secretary_permissions` is the per-secretary grant table — the source of
--     truth the session guard reads. A secretary with NO rows here (and an
--     empty `secretaries.permissions` array) sees nothing.
--   * `secretaries.role` stores the chosen preset id for display/pre-fill only;
--     it is never a substitute for the explicit grant list.
--
-- Backward compatibility: the legacy `secretaries.permissions` TEXT[] column
-- is untouched. Until a clinic migrates its staff to the new tables, the
-- session guard keeps honouring it (lib/permissions.ts GRANULAR_TO_LEGACY).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- R1. permissions — the catalog
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id           TEXT PRIMARY KEY,
  module       TEXT NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('view','create','edit','delete','export')),
  name_en      TEXT NOT NULL,
  name_ar      TEXT NOT NULL,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 100,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS permissions_module_idx
  ON public.permissions (module, sort_order);

INSERT INTO public.permissions (id, module, action, name_en, name_ar, is_sensitive, sort_order) VALUES
  ('appointments',            'appointments',      'view',   'View appointments',       'عرض المواعيد',                 FALSE, 10),
  ('appointments.manage',     'appointments',      'edit',   'Manage appointments',     'إدارة وحجز المواعيد',          FALSE, 11),
  ('patients',                'patients',          'view',   'View patients',           'عرض المرضى',                   FALSE, 20),
  ('patients.manage',         'patients',          'edit',   'Edit patients',           'تعديل بيانات المرضى',          FALSE, 21),
  ('patients.delete',         'patients',          'delete', 'Delete patients',         'حذف المرضى',                   TRUE,  22),
  ('patients.clinical',       'patients.clinical', 'view',   'View clinical records',   'عرض السجل السريري',            FALSE, 30),
  ('patients.clinical.manage','patients.clinical', 'edit',   'Edit clinical records',   'تعديل السجل السريري',          TRUE,  31),
  ('prescriptions',           'prescriptions',     'view',   'View prescriptions',      'عرض الروشتات',                 FALSE, 40),
  ('prescriptions.manage',    'prescriptions',     'edit',   'Write prescriptions',     'كتابة الروشتات',               FALSE, 41),
  ('lab_results',             'lab_results',       'view',   'View lab results',        'عرض نتائج التحاليل',           FALSE, 50),
  ('lab_results.manage',      'lab_results',       'edit',   'Manage lab results',      'إدارة نتائج التحاليل',         FALSE, 51),
  ('finance',                 'finance',           'view',   'View finance',            'عرض المالية',                  FALSE, 60),
  ('finance.collect',         'finance.collect',   'create', 'Collect payments',        'تحصيل المدفوعات',              FALSE, 61),
  ('finance.payments',        'finance.payments',  'create', 'Manage payments',         'إدارة المدفوعات',              FALSE, 62),
  ('finance.expenses',        'finance.expenses',  'edit',   'Manage expenses',         'إدارة المصروفات',              FALSE, 63),
  ('finance.expenses.delete', 'finance.expenses',  'delete', 'Delete expenses',         'حذف المصروفات',                TRUE,  64),
  ('finance.revenue',         'finance.revenue',   'view',   'View revenue',            'عرض الإيرادات',                TRUE,  65),
  ('finance.profit',          'finance.profit',    'view',   'View profit & margin',    'عرض الأرباح والهوامش',         TRUE,  66),
  ('reports',                 'reports',           'view',   'View reports',            'عرض التقارير',                 FALSE, 70),
  ('reports.manage',          'reports',           'edit',   'Manage reports',          'إدارة التقارير',               FALSE, 71),
  ('whatsapp',                'whatsapp',          'view',   'View WhatsApp',           'عرض الواتساب',                 FALSE, 80),
  ('whatsapp.send',           'whatsapp',          'create', 'Send WhatsApp',           'إرسال رسائل واتساب',           FALSE, 81),
  ('crm',                     'crm',               'view',   'View CRM',                'عرض CRM',                      FALSE, 90),
  ('crm.leads',               'crm.leads',         'edit',   'Manage leads',            'إدارة العملاء المحتملين',      FALSE, 91),
  ('crm.tasks',               'crm.tasks',         'edit',   'Manage follow-up tasks',  'إدارة مهام المتابعة',          FALSE, 92),
  ('crm.campaigns',           'crm.campaigns',     'edit',   'Manage campaigns',        'إدارة الحملات',                TRUE,  93),
  ('staff.view',              'staff',             'view',   'View staff',              'عرض الطاقم',                   FALSE, 100),
  ('staff.manage',            'staff',             'edit',   'Manage staff',            'إدارة الطاقم والصلاحيات',      TRUE,  101)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- R2. roles — presets (plan §6.4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id               TEXT PRIMARY KEY,
  clinic_id        TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en          TEXT NOT NULL,
  name_ar          TEXT NOT NULL,
  is_system_role   BOOLEAN NOT NULL DEFAULT FALSE,
  role_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, id)
);

INSERT INTO public.roles (id, clinic_id, name_en, name_ar, is_system_role, role_permissions) VALUES
  ('DOCTOR', NULL, 'Doctor / Clinical Lead', 'الطبيب — القائد السريري', TRUE, '["*"]'::jsonb),
  ('HEAD_SECRETARY', NULL, 'Head Secretary', 'سكرتير أول', TRUE,
    '["appointments","appointments.manage","patients","patients.manage","patients.delete","patients.clinical","patients.clinical.manage","prescriptions","prescriptions.manage","lab_results","lab_results.manage","finance","finance.collect","finance.payments","finance.expenses","finance.expenses.delete","finance.revenue","reports","reports.manage","whatsapp","whatsapp.send","crm","crm.leads","crm.tasks","crm.campaigns"]'::jsonb),
  ('RECEPTIONIST', NULL, 'Receptionist', 'موظف استقبال', TRUE,
    '["appointments","appointments.manage","patients","whatsapp","whatsapp.send"]'::jsonb),
  ('CLINICAL_ASSISTANT', NULL, 'Clinical Assistant', 'مساعد سريري', TRUE,
    '["appointments","appointments.manage","patients","patients.manage","patients.clinical","reports","reports.manage"]'::jsonb),
  ('BILLING_OFFICER', NULL, 'Billing Officer', 'محاسب', TRUE,
    '["patients","appointments","finance","finance.collect","finance.payments","finance.expenses","finance.revenue"]'::jsonb),
  ('MARKETING_OFFICER', NULL, 'Marketing Officer', 'مسؤول تسويق', TRUE,
    '["patients","whatsapp","whatsapp.send","crm","crm.leads","crm.tasks","crm.campaigns"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- R3. secretary_permissions — explicit per-secretary grants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.secretary_permissions (
  clinic_id     TEXT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  secretary_id  TEXT NOT NULL REFERENCES public.secretaries(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by    TEXT,
  granted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (secretary_id, permission_id)
);

CREATE INDEX IF NOT EXISTS secretary_permissions_clinic_idx
  ON public.secretary_permissions (clinic_id, secretary_id);

-- ----------------------------------------------------------------------------
-- R4. secretaries.role — preset id (display/pre-fill only)
-- ----------------------------------------------------------------------------
ALTER TABLE public.secretaries
  ADD COLUMN IF NOT EXISTS role TEXT;

-- ----------------------------------------------------------------------------
-- RLS: repeat the 0004/0005 guarantee for databases where the event trigger
-- could not be installed (plain Postgres without superuser).
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
       AND c.relname IN ('permissions','roles','secretary_permissions')
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

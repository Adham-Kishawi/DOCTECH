import type { ClinicUserSession } from "./clinicAuth";

/**
 * RBAC catalog (plan §6.3 / §6.4).
 *
 * This is the single source of truth for permission ids, their Arabic/English
 * labels and which of them are "sensitive" (need an extra warning before a
 * doctor revokes them). It is intentionally free of `server-only` so the same
 * catalog powers API guards, the sidebar filter and the staff matrix UI.
 *
 * NOTE: the ids here are exactly the keys the API routes already check via
 * `PERMISSIONS` in `lib/apiAuth.ts` — that module now re-exports this catalog,
 * so existing routes keep working without change.
 */

export interface PermissionDefinition {
  id: string;
  module: string;
  action: "view" | "create" | "edit" | "delete" | "export";
  nameEn: string;
  nameAr: string;
  isSensitive: boolean;
  sortOrder: number;
}

export const PERMISSIONS = {
  APPOINTMENTS_VIEW: "appointments",
  APPOINTMENTS_MANAGE: "appointments.manage",
  PATIENTS_VIEW: "patients",
  PATIENTS_MANAGE: "patients.manage",
  PATIENTS_DELETE: "patients.delete",
  CLINICAL_VIEW: "patients.clinical",
  CLINICAL_MANAGE: "patients.clinical.manage",
  PRESCRIPTIONS_VIEW: "prescriptions",
  PRESCRIPTIONS_MANAGE: "prescriptions.manage",
  LAB_RESULTS_VIEW: "lab_results",
  LAB_RESULTS_MANAGE: "lab_results.manage",
  REPORTS_VIEW: "reports",
  REPORTS_MANAGE: "reports.manage",
  FINANCE_VIEW: "finance",
  FINANCE_COLLECT: "finance.collect",
  FINANCE_PAYMENTS: "finance.payments",
  FINANCE_EXPENSES: "finance.expenses",
  FINANCE_EXPENSES_DELETE: "finance.expenses.delete",
  FINANCE_REVENUE: "finance.revenue",
  FINANCE_PROFIT: "finance.profit",
  WHATSAPP_VIEW: "whatsapp",
  WHATSAPP_SEND: "whatsapp.send",
  STAFF_VIEW: "staff.view",
  STAFF_MANAGE: "staff.manage",
  CRM_VIEW: "crm",
  CRM_LEADS: "crm.leads",
  CRM_TASKS: "crm.tasks",
  CRM_CAMPAIGNS: "crm.campaigns",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const def = (
  id: PermissionKey,
  module: string,
  action: PermissionDefinition["action"],
  nameEn: string,
  nameAr: string,
  isSensitive: boolean,
  sortOrder: number
): PermissionDefinition => ({ id, module, action, nameEn, nameAr, isSensitive, sortOrder });

/** The 28 atomic permissions enforced across the platform. */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  def(PERMISSIONS.APPOINTMENTS_VIEW, "appointments", "view", "View appointments", "عرض المواعيد", false, 10),
  def(PERMISSIONS.APPOINTMENTS_MANAGE, "appointments", "edit", "Manage appointments", "إدارة وحجز المواعيد", false, 11),
  def(PERMISSIONS.PATIENTS_VIEW, "patients", "view", "View patients", "عرض المرضى", false, 20),
  def(PERMISSIONS.PATIENTS_MANAGE, "patients", "edit", "Edit patients", "تعديل بيانات المرضى", false, 21),
  def(PERMISSIONS.PATIENTS_DELETE, "patients", "delete", "Delete patients", "حذف المرضى", true, 22),
  def(PERMISSIONS.CLINICAL_VIEW, "patients.clinical", "view", "View clinical records", "عرض السجل السريري", false, 30),
  def(PERMISSIONS.CLINICAL_MANAGE, "patients.clinical", "edit", "Edit clinical records", "تعديل السجل السريري", true, 31),
  def(PERMISSIONS.PRESCRIPTIONS_VIEW, "prescriptions", "view", "View prescriptions", "عرض الروشتات", false, 40),
  def(PERMISSIONS.PRESCRIPTIONS_MANAGE, "prescriptions", "edit", "Write prescriptions", "كتابة الروشتات", false, 41),
  def(PERMISSIONS.LAB_RESULTS_VIEW, "lab_results", "view", "View lab results", "عرض نتائج التحاليل", false, 50),
  def(PERMISSIONS.LAB_RESULTS_MANAGE, "lab_results", "edit", "Manage lab results", "إدارة نتائج التحاليل", false, 51),
  def(PERMISSIONS.FINANCE_VIEW, "finance", "view", "View finance", "عرض المالية", false, 60),
  def(PERMISSIONS.FINANCE_COLLECT, "finance.collect", "create", "Collect payments", "تحصيل المدفوعات", false, 61),
  def(PERMISSIONS.FINANCE_PAYMENTS, "finance.payments", "create", "Manage payments", "إدارة المدفوعات", false, 62),
  def(PERMISSIONS.FINANCE_EXPENSES, "finance.expenses", "edit", "Manage expenses", "إدارة المصروفات", false, 63),
  def(PERMISSIONS.FINANCE_EXPENSES_DELETE, "finance.expenses.delete", "delete", "Delete expenses", "حذف المصروفات", true, 64),
  def(PERMISSIONS.FINANCE_REVENUE, "finance.revenue", "view", "View revenue", "عرض الإيرادات", true, 65),
  def(PERMISSIONS.FINANCE_PROFIT, "finance.profit", "view", "View profit & margin", "عرض الأرباح والهوامش", true, 66),
  def(PERMISSIONS.REPORTS_VIEW, "reports", "view", "View reports", "عرض التقارير", false, 70),
  def(PERMISSIONS.REPORTS_MANAGE, "reports", "edit", "Manage reports", "إدارة التقارير", false, 71),
  def(PERMISSIONS.WHATSAPP_VIEW, "whatsapp", "view", "View WhatsApp", "عرض الواتساب", false, 80),
  def(PERMISSIONS.WHATSAPP_SEND, "whatsapp.send", "create", "Send WhatsApp", "إرسال رسائل واتساب", false, 81),
  def(PERMISSIONS.CRM_VIEW, "crm", "view", "View CRM", "عرض CRM", false, 90),
  def(PERMISSIONS.CRM_LEADS, "crm.leads", "edit", "Manage leads", "إدارة العملاء المحتملين", false, 91),
  def(PERMISSIONS.CRM_TASKS, "crm.tasks", "edit", "Manage follow-up tasks", "إدارة مهام المتابعة", false, 92),
  def(PERMISSIONS.CRM_CAMPAIGNS, "crm.campaigns", "edit", "Manage campaigns", "إدارة الحملات", true, 93),
  def(PERMISSIONS.STAFF_VIEW, "staff", "view", "View staff", "عرض الطاقم", false, 100),
  def(PERMISSIONS.STAFF_MANAGE, "staff", "edit", "Manage staff", "إدارة الطاقم والصلاحيات", true, 101),
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_CATALOG.map((p) => p.id);
export const SENSITIVE_PERMISSION_IDS: string[] = PERMISSION_CATALOG.filter((p) => p.isSensitive).map((p) => p.id);

export const isKnownPermission = (id: string): boolean => ALL_PERMISSION_IDS.includes(id);
export const isSensitivePermission = (id: string): boolean => SENSITIVE_PERMISSION_IDS.includes(id);

/** Catalog grouped by module, ordered for the matrix UI. */
export function permissionsByModule(): { module: string; items: PermissionDefinition[] }[] {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const p of [...PERMISSION_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!groups.has(p.module)) groups.set(p.module, []);
    groups.get(p.module)!.push(p);
  }
  return [...groups.entries()].map(([module, items]) => ({ module, items }));
}

// ---------------------------------------------------------------------------
// Role presets (plan §6.4) — used by the staff UI to pre-fill a matrix.
// ---------------------------------------------------------------------------

export interface RoleDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  isSystemRole: boolean;
  /** "*" = every permission. */
  defaults: string[];
}

export const ROLES: RoleDefinition[] = [
  {
    id: "DOCTOR",
    nameEn: "Doctor / Clinical Lead",
    nameAr: "الطبيب — القائد السريري",
    isSystemRole: true,
    defaults: ["*"],
  },
  {
    id: "HEAD_SECRETARY",
    nameEn: "Head Secretary",
    nameAr: "سكرتير أول",
    isSystemRole: true,
    defaults: ALL_PERMISSION_IDS.filter((id) => id !== PERMISSIONS.FINANCE_PROFIT),
  },
  {
    id: "RECEPTIONIST",
    nameEn: "Receptionist",
    nameAr: "موظف استقبال",
    isSystemRole: true,
    defaults: [
      PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.WHATSAPP_VIEW,
      PERMISSIONS.WHATSAPP_SEND,
    ],
  },
  {
    id: "CLINICAL_ASSISTANT",
    nameEn: "Clinical Assistant",
    nameAr: "مساعد سريري",
    isSystemRole: true,
    defaults: [
      PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.PATIENTS_MANAGE,
      PERMISSIONS.CLINICAL_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_MANAGE,
    ],
  },
  {
    id: "BILLING_OFFICER",
    nameEn: "Billing Officer",
    nameAr: "محاسب",
    isSystemRole: true,
    defaults: [
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_COLLECT,
      PERMISSIONS.FINANCE_PAYMENTS,
      PERMISSIONS.FINANCE_EXPENSES,
      PERMISSIONS.FINANCE_REVENUE,
    ],
  },
  {
    id: "MARKETING_OFFICER",
    nameEn: "Marketing Officer",
    nameAr: "مسؤول تسويق",
    isSystemRole: true,
    defaults: [
      PERMISSIONS.PATIENTS_VIEW,
      PERMISSIONS.WHATSAPP_VIEW,
      PERMISSIONS.WHATSAPP_SEND,
      PERMISSIONS.CRM_VIEW,
      PERMISSIONS.CRM_LEADS,
      PERMISSIONS.CRM_TASKS,
      PERMISSIONS.CRM_CAMPAIGNS,
    ],
  },
];

export const ROLE_BY_ID: Record<string, RoleDefinition> = Object.fromEntries(ROLES.map((r) => [r.id, r]));

/** Expand a role preset to a concrete permission list ("*" stays as ["*"]). */
export function expandRole(roleId: string): string[] {
  const role = ROLE_BY_ID[roleId];
  if (!role) return [];
  return [...role.defaults];
}

// ---------------------------------------------------------------------------
// Enforcement
// ---------------------------------------------------------------------------

/**
 * Legacy coarse keys still granted to older staff rows map onto the granular
 * permission that supersedes them, so a secretary created before Phase 3 keeps
 * the access they were promised.
 */
const GRANULAR_TO_LEGACY: Record<string, string> = {
  "appointments.manage": "appointments",
  "patients.manage": "patients",
  "patients.delete": "patients",
  "patients.clinical": "patients",
  "patients.clinical.manage": "patients",
  prescriptions: "patients",
  "prescriptions.manage": "patients",
  lab_results: "reports",
  "lab_results.manage": "reports",
  "reports.manage": "reports",
  finance: "billing",
  "finance.collect": "billing",
  "finance.payments": "billing",
  "finance.expenses": "billing",
  "finance.expenses.delete": "billing",
  "finance.revenue": "billing",
  "finance.profit": "billing",
  "whatsapp.send": "whatsapp",
  "crm.leads": "patients",
  "crm.tasks": "appointments",
  "crm.campaigns": "whatsapp",
};

/**
 * Doctors implicitly hold every permission. Secretaries are checked against
 * their granted list, accepting the `all` / `*` master switch and the legacy
 * coarse keys.
 */
export function can(session: ClinicUserSession | null | undefined, permission: string): boolean {
  if (!session) return false;
  if (session.role === "doctor") return true;

  const granted = session.permissions ?? [];
  if (granted.includes("*") || granted.includes("all") || granted.includes(PERMISSIONS.STAFF_MANAGE)) {
    return true;
  }
  if (granted.includes(permission)) return true;

  const legacyKey = GRANULAR_TO_LEGACY[permission];
  if (legacyKey && granted.includes(legacyKey)) return true;

  return false;
}

/** Any of the listed permissions is enough. */
export function canAny(session: ClinicUserSession | null | undefined, permissions: string[]): boolean {
  return permissions.some((p) => can(session, p));
}

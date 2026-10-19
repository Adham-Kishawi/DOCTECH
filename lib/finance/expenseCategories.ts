/**
 * System expense categories — the TypeScript mirror of the seed rows inserted
 * by `0005_billing_and_finance.sql` (ids `cat_*`, `clinic_id NULL`).
 *
 * The database table is the source of truth; this registry exists so the app
 * still renders correct labels and the P&L still classifies an expense on a
 * database where Phase 2's migration has not been applied yet (the plan runs
 * the migrations manually in Phase 9). The API always prefers the row from
 * `expense_categories` and falls back to this list.
 */

export type BehaviorType =
  | "FIXED"
  | "SEMI_VARIABLE"
  | "VARIABLE"
  | "STEP_FIXED"
  | "CAPEX"
  | "TAX";

export interface SystemCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  behavior: BehaviorType;
  /** Enters COGS: consumed per patient (supplies, lab work). */
  isClinicalCost: boolean;
  isPatientCare: boolean;
  sortOrder: number;
  icon: string;
  color: string;
}

export const SYSTEM_CATEGORIES: SystemCategory[] = [
  { id: "cat_rent", code: "RENT", nameEn: "Clinic Rent", nameAr: "إيجار العيادة", behavior: "FIXED", isClinicalCost: false, isPatientCare: false, sortOrder: 10, icon: "building", color: "#1A4B8C" },
  { id: "cat_salaries", code: "SALARIES", nameEn: "Salaries & Staff", nameAr: "المرتبات والأجور", behavior: "FIXED", isClinicalCost: false, isPatientCare: false, sortOrder: 20, icon: "users", color: "#6366F1" },
  { id: "cat_utilities", code: "UTILITIES", nameEn: "Electricity & Utilities", nameAr: "الكهرباء والمياه", behavior: "SEMI_VARIABLE", isClinicalCost: false, isPatientCare: false, sortOrder: 30, icon: "zap", color: "#F59E0B" },
  { id: "cat_supplies", code: "SUPPLIES", nameEn: "Medical Supplies", nameAr: "المستلزمات الطبية", behavior: "VARIABLE", isClinicalCost: true, isPatientCare: true, sortOrder: 40, icon: "package", color: "#10B981" },
  { id: "cat_lab", code: "LAB", nameEn: "Laboratory & Tests", nameAr: "المعمل والتحاليل", behavior: "VARIABLE", isClinicalCost: true, isPatientCare: true, sortOrder: 50, icon: "flask", color: "#8B5CF6" },
  { id: "cat_transport", code: "TRANSPORT", nameEn: "Delivery & Transport", nameAr: "توصيل ومندوبين", behavior: "VARIABLE", isClinicalCost: false, isPatientCare: false, sortOrder: 60, icon: "truck", color: "#0EA5E9" },
  { id: "cat_maint", code: "MAINTENANCE", nameEn: "Maintenance & Repairs", nameAr: "الصيانة والتشغيل", behavior: "STEP_FIXED", isClinicalCost: false, isPatientCare: false, sortOrder: 70, icon: "tool", color: "#06B6D4" },
  { id: "cat_marketing", code: "MARKETING", nameEn: "Marketing & Ads", nameAr: "التسويق والإعلان", behavior: "STEP_FIXED", isClinicalCost: false, isPatientCare: false, sortOrder: 80, icon: "megaphone", color: "#EC4899" },
  { id: "cat_software", code: "SOFTWARE", nameEn: "Software & Subscriptions", nameAr: "البرامج والاشتراكات", behavior: "FIXED", isClinicalCost: false, isPatientCare: false, sortOrder: 90, icon: "monitor", color: "#64748B" },
  { id: "cat_taxes", code: "TAXES", nameEn: "Taxes & Licenses", nameAr: "الضرائب والتراخيص", behavior: "TAX", isClinicalCost: false, isPatientCare: false, sortOrder: 110, icon: "receipt", color: "#EF4444" },
  { id: "cat_hospitality", code: "MISC", nameEn: "Petty Cash & Hospitality", nameAr: "نثريات وضيافة", behavior: "VARIABLE", isClinicalCost: false, isPatientCare: false, sortOrder: 120, icon: "coffee", color: "#A16207" },
  { id: "cat_capex", code: "CAPEX", nameEn: "Equipment & Assets", nameAr: "أجهزة وأصول", behavior: "CAPEX", isClinicalCost: false, isPatientCare: false, sortOrder: 130, icon: "monitorCog", color: "#475569" },
];

export const SYSTEM_CATEGORY_BY_ID: Record<string, SystemCategory> = Object.fromEntries(
  SYSTEM_CATEGORIES.map((category) => [category.id, category])
);

export const SYSTEM_CATEGORY_BY_CODE: Record<string, SystemCategory> = Object.fromEntries(
  SYSTEM_CATEGORIES.map((category) => [category.code, category])
);

/** Behavior of a legacy expense row that predates `behavior_type_snapshot`. */
export function behaviorForCode(code: string | null | undefined): BehaviorType {
  if (!code) return "VARIABLE";
  return SYSTEM_CATEGORY_BY_CODE[code]?.behavior ?? "VARIABLE";
}

export const isClinicalBehavior = (line: { isClinicalCost?: boolean | null }): boolean =>
  Boolean(line.isClinicalCost);

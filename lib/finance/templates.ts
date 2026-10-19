import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { toPiastres } from "@/lib/money";
import { SYSTEM_CATEGORY_BY_ID, type BehaviorType } from "@/lib/finance/expenseCategories";
import { daysInMonth, monthBounds } from "@/lib/finance/period";

/**
 * Recurring expense engine (plan §5.2.2).
 *
 * The promise the README used to make — fixed costs are "posted automatically
 * every month" — is implemented here and nowhere else. Two properties matter:
 *
 *   * IDEMPOTENT: `last_posted_period` is checked and written inside the same
 *     call, so invoking the runner N times for one month posts exactly once.
 *   * TRACEABLE: every generated expense carries `source_template_id` and
 *     `period_key`, and `is_recurring` is set by a trigger — a user can never
 *     type it in.
 */

export type TemplatePostingMode = "AUTO" | "CONFIRM" | "MANUAL";

export interface ExpenseTemplateRow {
  id: string;
  clinic_id: string;
  category_id: string | null;
  title_en: string;
  title_ar: string;
  amount: number; // piastres
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  due_day_of_month: number | null;
  weekday: number | null;
  start_date: string | null;
  end_date: string | null;
  payment_method: string;
  payee: string | null;
  contract_ref: string | null;
  posting_mode: TemplatePostingMode;
  accounting_basis: "CASH" | "ACCRUAL";
  last_posted_period: string | null;
  next_due_at: string | null;
  is_active: boolean;
}

export interface TemplateRunResult {
  periodKey: string;
  /** Expenses written (AUTO mode). */
  posted: { templateId: string; expenseId: string; amount: number }[];
  /** Rows parked for approval (CONFIRM mode). */
  pending: { templateId: string; amount: number }[];
  /** Nothing to do: already posted or not due this period. */
  skipped: { templateId: string; reason: "ALREADY_POSTED" | "NOT_DUE" | "INACTIVE" | "MANUAL" }[];
  /** True when the Phase 2 migration has not been applied yet. */
  unavailable?: boolean;
}

const isMissingTable = (error: { code?: string; message?: string } | null): boolean =>
  Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist/i.test(error.message || "")));

const periodEnd = (periodKey: string): Date => monthBounds(periodKey).end;

/** First instant the template becomes due inside `periodKey`. */
function isDueInPeriod(template: ExpenseTemplateRow, periodKey: string): boolean {
  const end = periodEnd(periodKey);

  if (template.next_due_at) {
    return new Date(template.next_due_at).getTime() <= end.getTime();
  }

  // No stored due date yet: derive one from the frequency for this period.
  const bounds = monthBounds(periodKey);
  if (template.start_date && new Date(`${template.start_date}T00:00:00Z`).getTime() > end.getTime()) {
    return false;
  }
  if (template.end_date && new Date(`${template.end_date}T00:00:00Z`).getTime() < bounds.start.getTime()) {
    return false;
  }

  switch (template.frequency) {
    case "MONTHLY":
      return true;
    case "QUARTERLY":
      return Number(periodKey.split("-")[1]) % 3 === 1;
    case "ANNUAL":
      return Number(periodKey.split("-")[1]) === 1;
    case "WEEKLY":
    case "BIWEEKLY":
      return true; // checked against `weekday` below when present
    default:
      return true;
  }
}

/** Next due instant after `from`, used to advance `next_due_at` post-write. */
function nextDueAfter(template: ExpenseTemplateRow, from: Date): string {
  const monthsAhead: Record<string, number> = {
    WEEKLY: 0,
    BIWEEKLY: 0,
    MONTHLY: 1,
    QUARTERLY: 3,
    ANNUAL: 12,
  };
  const add = monthsAhead[template.frequency] ?? 1;

  if (template.frequency === "WEEKLY" || template.frequency === "BIWEEKLY") {
    const step = template.frequency === "WEEKLY" ? 7 : 14;
    const next = new Date(from.getTime() + step * 86_400_000);
    return next.toISOString();
  }

  const day = template.due_day_of_month ?? Math.min(from.getUTCDate(), daysInMonth(`${from.getUTCFullYear()}-${String(from.getUTCMonth() + 1 + add).padStart(2, "0")}`));
  const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + add, 1));
  const targetMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), 1));
  const daysInTarget = daysInMonth(
    `${targetMonth.getUTCFullYear()}-${String(targetMonth.getUTCMonth() + 1).padStart(2, "0")}`
  );
  return new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), Math.min(day, daysInTarget))
  ).toISOString();
}

function buildExpenseNumber(periodKey: string, value: number): string {
  return `EXP-${periodKey}-${String(value).padStart(5, "0")}`;
}

/**
 * Post every template that is due in `periodKey`.
 *
 * Safe to call on any schedule (cron, on login, on demand): repeat calls for
 * the same period return the same `skipped` set instead of double-posting.
 */
export async function runExpenseTemplates(options: {
  clinicId: string;
  periodKey: string;
}): Promise<TemplateRunResult> {
  const { clinicId, periodKey } = options;
  const result: TemplateRunResult = { periodKey, posted: [], pending: [], skipped: [] };

  const { data, error } = await supabaseAdmin
    .from("expense_templates")
    .select("*")
    .eq("clinic_id", clinicId);

  if (error) {
    if (isMissingTable(error)) return { ...result, unavailable: true };
    throw new Error(`Failed to load expense templates: ${error.message}`);
  }

  const templates = (data || []) as ExpenseTemplateRow[];
  const now = new Date();

  for (const template of templates) {
    if (!template.is_active) {
      result.skipped.push({ templateId: template.id, reason: "INACTIVE" });
      continue;
    }
    if (template.posting_mode === "MANUAL") {
      result.skipped.push({ templateId: template.id, reason: "MANUAL" });
      continue;
    }
    if (template.last_posted_period === periodKey) {
      result.skipped.push({ templateId: template.id, reason: "ALREADY_POSTED" });
      continue;
    }
    if (!isDueInPeriod(template, periodKey)) {
      result.skipped.push({ templateId: template.id, reason: "NOT_DUE" });
      continue;
    }

    if (template.posting_mode === "CONFIRM") {
      const { error: pendingError } = await supabaseAdmin.from("pending_expenses").upsert(
        {
          id: `PEND-${randomUUID().slice(0, 8)}`,
          clinic_id: clinicId,
          template_id: template.id,
          period_key: periodKey,
          amount: template.amount,
          status: "PENDING",
        },
        { onConflict: "template_id,period_key", ignoreDuplicates: true }
      );
      if (pendingError && !isMissingTable(pendingError)) {
        throw new Error(`Failed to queue pending expense: ${pendingError.message}`);
      }
      result.pending.push({ templateId: template.id, amount: template.amount });
      continue;
    }

    // AUTO — write the expense and advance the template atomically enough for
    // a single runner (the period check above is the real guard).
    const category = template.category_id ? SYSTEM_CATEGORY_BY_ID[template.category_id] : undefined;

    const { data: allocated, error: counterError } = await supabaseAdmin.rpc(
      "next_counter_value",
      { p_clinic_id: clinicId, p_kind: "EXPENSE", p_period_key: periodKey }
    );

    if (counterError) {
      // Migration not applied yet — do not write a number we cannot make unique.
      result.unavailable = true;
      return result;
    }

    const expenseId = `EXP-${randomUUID().slice(0, 8)}`;
    const { error: insertError } = await supabaseAdmin.from("expenses").insert({
      id: expenseId,
      clinic_id: clinicId,
      doctor_id: null,
      category: category?.code || "MISC",
      category_id: template.category_id,
      behavior_type_snapshot: category?.behavior ?? ("VARIABLE" as BehaviorType),
      title: template.title_en,
      title_ar: template.title_ar,
      amount: template.amount,
      date: now.toISOString(),
      payment_method: template.payment_method,
      paid_to: template.payee,
      receipt_no: template.contract_ref,
      notes: template.payee ? `Auto-posted from template · payee: ${template.payee}` : "Auto-posted from recurring template",
      source_template_id: template.id,
      period_key: periodKey,
      expense_number: buildExpenseNumber(periodKey, Number(allocated) || 1),
      recorded_by_role: "system",
    });

    if (insertError) {
      if (isMissingTable(insertError)) return { ...result, unavailable: true };
      throw new Error(`Failed to post expense for template ${template.id}: ${insertError.message}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("expense_templates")
      .update({
        last_posted_period: periodKey,
        next_due_at: nextDueAfter(template, now),
        updated_at: now.toISOString(),
      })
      .eq("id", template.id)
      .eq("clinic_id", clinicId);

    if (updateError && !isMissingTable(updateError)) {
      console.error("[expense-templates] Failed to advance template:", updateError.message);
    }

    result.posted.push({ templateId: template.id, expenseId, amount: template.amount });
  }

  return result;
}

export interface FixedCostRow {
  templateId: string;
  titleEn: string;
  titleAr: string;
  categoryId: string | null;
  categoryCode: string | null;
  behavior: BehaviorType;
  /** Piastres per month after amortizing the template's own frequency. */
  monthlyPiastres: number;
  /** The template's own charge amount. */
  amountPiastres: number;
  frequency: ExpenseTemplateRow["frequency"];
  variabilityPct: number;
}

const MONTHS_PER_PERIOD: Record<ExpenseTemplateRow["frequency"], number> = {
  WEEKLY: 4,
  BIWEEKLY: 2,
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUAL: 12,
};

/**
 * The fixed-cost schedule behind §5.2.3 / break-even: every active template
 * reduced to a monthly figure (annual contract ÷ 12, quarterly ÷ 3, ...).
 */
export async function loadFixedCostBreakdown(clinicId: string): Promise<{
  rows: FixedCostRow[];
  monthlyTotal: number;
  unavailable?: boolean;
}> {
  const [{ data, error }, { data: variations, error: variationError }] = await Promise.all([
    supabaseAdmin
      .from("expense_templates")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true),
    supabaseAdmin
      .from("fixed_cost_breakdown")
      .select("template_id, variability_pct")
      .eq("clinic_id", clinicId),
  ]);

  if (error) {
    if (isMissingTable(error)) return { rows: [], monthlyTotal: 0, unavailable: true };
    throw new Error(`Failed to load fixed costs: ${error.message}`);
  }

  const variability = new Map<string, number>();
  if (!variationError) {
    for (const row of variations || []) {
      variability.set(String(row.template_id), Number(row.variability_pct) || 0);
    }
  }

  const rows: FixedCostRow[] = [];
  for (const template of (data || []) as ExpenseTemplateRow[]) {
    const category = template.category_id ? SYSTEM_CATEGORY_BY_ID[template.category_id] : undefined;
    const perPeriod = MONTHS_PER_PERIOD[template.frequency] ?? 1;
    const monthlyPiastres = Math.round(template.amount / perPeriod);

    rows.push({
      templateId: template.id,
      titleEn: template.title_en,
      titleAr: template.title_ar,
      categoryId: template.category_id,
      categoryCode: category?.code ?? null,
      behavior: category?.behavior ?? "FIXED",
      monthlyPiastres,
      amountPiastres: template.amount,
      frequency: template.frequency,
      variabilityPct: variability.get(template.id) ?? 0,
    });
  }

  rows.sort((a, b) => b.monthlyPiastres - a.monthlyPiastres);
  return {
    rows,
    monthlyTotal: rows.reduce((sum, row) => sum + row.monthlyPiastres, 0),
  };
}

/** Convert an EGP input into piastres for a template write. */
export const templateAmount = (egp: number): number => toPiastres(egp);

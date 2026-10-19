import type { BehaviorType } from "@/lib/finance/expenseCategories";

/**
 * Profit & Loss — pure computation, integer piastres in, integer piastres out.
 *
 * There is deliberately no `Math.random`, no default percentage and no
 * fallback total anywhere in this file: every figure it returns is a sum of
 * rows that came from `appointments`, `invoices`, `refunds` and `expenses`.
 * The UI is forbidden from inventing a number the database does not have —
 * that is what produced the old 65/22/13 revenue split (plan §5.4, E10/E11).
 */

export interface PlExpenseLine {
  id: string;
  /** Piastres, always positive. */
  amount: number;
  behavior: BehaviorType;
  /** Category marks this as cost of care (supplies/lab) → COGS. */
  isClinicalCost: boolean;
  categoryCode: string | null;
  labelEn: string;
  labelAr: string;
}

export interface PlRevenueLine {
  id: string;
  /** Piastres actually collected (amount_paid). */
  amount: number;
  groupEn: string;
  groupAr: string;
  isConsultation: boolean;
}

export interface PlSectionItem {
  key: string;
  labelEn: string;
  labelAr: string;
  amount: number;
}

export interface ProfitAndLoss {
  revenue: {
    groups: PlSectionItem[];
    discounts: number;
    refunds: number;
    /** Revenue after discounts and refunds. */
    gross: number;
  };
  cogs: { items: PlSectionItem[]; total: number };
  grossProfit: number;
  grossMarginPct: number | null;
  fixedOverhead: { items: PlSectionItem[]; total: number };
  variableOpex: { items: PlSectionItem[]; total: number };
  /** Capital purchases are not an operating cost — reported, not netted. */
  capex: { items: PlSectionItem[]; total: number };
  totalOperatingExpenses: number;
  netProfit: number;
  netMarginPct: number | null;
  /** Sum of every posted expense in the period (opex + cogs + capex). */
  totalExpensesAll: number;
}

export interface PnlInput {
  revenueLines: PlRevenueLine[];
  expenseLines: PlExpenseLine[];
  /** Discounts granted in the period (positive piastres). */
  discounts?: number;
  /** Refunds issued in the period (positive piastres). */
  refunds?: number;
}

const pct = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : null;

/** Sums a list into one bucket keyed by category, preserving label pairs. */
function bucket(
  lines: PlExpenseLine[],
  matches: (line: PlExpenseLine) => boolean
): PlSectionItem[] {
  const map = new Map<string, PlSectionItem>();
  for (const line of lines) {
    if (!matches(line)) continue;
    const key = line.categoryCode || "MISC";
    const existing = map.get(key);
    if (existing) {
      existing.amount += line.amount;
    } else {
      map.set(key, {
        key,
        labelEn: line.labelEn,
        labelAr: line.labelAr,
        amount: line.amount,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

const total = (items: PlSectionItem[]): number => items.reduce((sum, item) => sum + item.amount, 0);

export function computeProfitAndLoss(input: PnlInput): ProfitAndLoss {
  const { expenseLines } = input;

  // --- 1. Revenue -----------------------------------------------------------
  const revenueGroups = new Map<string, PlSectionItem>();
  for (const line of input.revenueLines) {
    if (line.amount === 0) continue;
    const key = `${line.isConsultation ? "CONSULT" : "OTHER"}:${line.groupEn}`;
    const existing = revenueGroups.get(key);
    if (existing) {
      existing.amount += line.amount;
    } else {
      revenueGroups.set(key, {
        key,
        labelEn: line.groupEn,
        labelAr: line.groupAr,
        amount: line.amount,
      });
    }
  }

  const collected = [...revenueGroups.values()].reduce((sum, group) => sum + group.amount, 0);
  const discounts = Math.max(0, input.discounts ?? 0);
  const refunds = Math.max(0, input.refunds ?? 0);
  const gross = collected - discounts - refunds;

  // --- 2. COGS --------------------------------------------------------------
  const cogsItems = bucket(expenseLines, (line) => line.isClinicalCost);
  const cogsTotal = total(cogsItems);

  const grossProfit = gross - cogsTotal;

  // --- 3. Operating expenses by behavior -----------------------------------
  const fixedItems = bucket(
    expenseLines,
    (line) =>
      !line.isClinicalCost &&
      (line.behavior === "FIXED" || line.behavior === "SEMI_VARIABLE" || line.behavior === "STEP_FIXED")
  );
  const variableItems = bucket(
    expenseLines,
    (line) =>
      !line.isClinicalCost &&
      (line.behavior === "VARIABLE" || line.behavior === "TAX")
  );
  const capexItems = bucket(expenseLines, (line) => line.behavior === "CAPEX");

  const fixedTotal = total(fixedItems);
  const variableTotal = total(variableItems);
  const capexTotal = total(capexItems);
  const totalOperatingExpenses = fixedTotal + variableTotal;

  const netProfit = grossProfit - totalOperatingExpenses;
  const totalExpensesAll = cogsTotal + totalOperatingExpenses + capexTotal;

  return {
    revenue: {
      groups: [...revenueGroups.values()].sort((a, b) => b.amount - a.amount),
      discounts,
      refunds,
      gross,
    },
    cogs: { items: cogsItems, total: cogsTotal },
    grossProfit,
    grossMarginPct: pct(grossProfit, gross),
    fixedOverhead: { items: fixedItems, total: fixedTotal },
    variableOpex: { items: variableItems, total: variableTotal },
    capex: { items: capexItems, total: capexTotal },
    totalOperatingExpenses,
    netProfit,
    netMarginPct: pct(netProfit, gross),
    totalExpensesAll,
  };
}

export interface PnlAlert {
  code: string;
  level: "info" | "warning";
  messageEn: string;
  messageAr: string;
}

/**
 * Early warning: direct clinical cost running hot against revenue. The plan
 * sets the threshold at 40% (§5.4); no alert fires without a revenue base.
 */
export function pnlAlerts(pl: ProfitAndLoss): PnlAlert[] {
  const alerts: PnlAlert[] = [];
  const revenue = pl.revenue.gross;

  if (revenue > 0) {
    const cogsRatio = pl.cogs.total / revenue;
    if (cogsRatio > 0.4) {
      alerts.push({
        code: "COGS_HIGH",
        level: "warning",
        messageEn: `Direct clinical costs are ${(cogsRatio * 100).toFixed(0)}% of revenue (threshold 40%).`,
        messageAr: `تكلفة التحاليل والمستلزمات ${(cogsRatio * 100).toFixed(0)}٪ من الإيراد (الحد ٤٠٪).`,
      });
    }
  }

  if (revenue > 0 && pl.netProfit < 0) {
    alerts.push({
      code: "NET_LOSS",
      level: "warning",
      messageEn: "This period is running at a loss.",
      messageAr: "الفترة الحالية خسارة صافية.",
    });
  }

  return alerts;
}

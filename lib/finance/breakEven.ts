/**
 * Break-even analysis (plan §5.3) — the figure that turns this app from a
 * ledger into a business partner for the clinic owner.
 *
 *   avg revenue / visit   = revenue ÷ visits
 *   direct cost / visit   = COGS ÷ visits
 *   contribution / visit  = avg − direct
 *   break-even visits     = fixed monthly cost ÷ contribution / visit
 *
 * Every input is measured, not assumed. When an input cannot produce a
 * meaningful answer (no visits recorded, contribution ≤ 0) the result is
 * `null` rather than a fabricated number the owner might act on.
 */

export interface BreakEvenInput {
  /** Piastres collected in the period. */
  revenue: number;
  /** Completed visits in the period (appointments with revenue). */
  visits: number;
  /** Piastres of clinical cost (COGS) in the period. */
  cogs: number;
  /** Piastres of fixed cost for ONE month (amortized or actually posted). */
  fixedMonthly: number;
  /** Assumed working days per month — an explicit assumption, labelled as one. */
  workingDays?: number;
}

export interface BreakEvenResult {
  avgRevenuePerVisit: number | null;
  directCostPerVisit: number | null;
  contributionPerVisit: number | null;
  contributionMarginPct: number | null;
  fixedMonthly: number;
  /** Visits needed to cover fixed cost; null when it cannot be computed. */
  breakEvenVisits: number | null;
  breakEvenVisitsPerDay: number | null;
  workingDays: number;
  /** false when an input made the calculation impossible. */
  computable: boolean;
  reason?: "NO_VISITS" | "NO_CONTRIBUTION" | "NO_FIXED_COST";
}

export const DEFAULT_WORKING_DAYS = 30;

export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const workingDays = input.workingDays ?? DEFAULT_WORKING_DAYS;

  if (!Number.isFinite(input.visits) || input.visits <= 0) {
    return {
      avgRevenuePerVisit: null,
      directCostPerVisit: null,
      contributionPerVisit: null,
      contributionMarginPct: null,
      fixedMonthly: input.fixedMonthly,
      breakEvenVisits: null,
      breakEvenVisitsPerDay: null,
      workingDays,
      computable: false,
      reason: "NO_VISITS",
    };
  }

  const avgRevenue = Math.round(input.revenue / input.visits);
  const directCost = Math.round(input.cogs / input.visits);
  const contribution = avgRevenue - directCost;

  if (contribution <= 0 || input.fixedMonthly <= 0) {
    return {
      avgRevenuePerVisit: avgRevenue,
      directCostPerVisit: directCost,
      contributionPerVisit: contribution,
      contributionMarginPct:
        avgRevenue > 0 ? Number(((contribution / avgRevenue) * 100).toFixed(1)) : null,
      fixedMonthly: input.fixedMonthly,
      breakEvenVisits: null,
      breakEvenVisitsPerDay: null,
      workingDays,
      computable: false,
      reason: contribution <= 0 ? "NO_CONTRIBUTION" : "NO_FIXED_COST",
    };
  }

  const breakEvenVisits = Math.ceil(input.fixedMonthly / contribution);

  return {
    avgRevenuePerVisit: avgRevenue,
    directCostPerVisit: directCost,
    contributionPerVisit: contribution,
    contributionMarginPct: Number(((contribution / avgRevenue) * 100).toFixed(1)),
    fixedMonthly: input.fixedMonthly,
    breakEvenVisits,
    breakEvenVisitsPerDay: Math.ceil(breakEvenVisits / workingDays),
    workingDays,
    computable: true,
  };
}

import { describe, expect, it } from "vitest";
import { computeProfitAndLoss, pnlAlerts, type PlExpenseLine, type PlRevenueLine } from "@/lib/finance/pl";

const rev = (
  id: string,
  amount: number,
  groupEn = "Consultations",
  isConsultation = true
): PlRevenueLine => ({ id, amount, groupEn, groupAr: groupEn, isConsultation });

const exp = (
  id: string,
  amount: number,
  behavior: PlExpenseLine["behavior"],
  isClinicalCost: boolean,
  categoryCode: string
): PlExpenseLine => ({
  id,
  amount,
  behavior,
  isClinicalCost,
  categoryCode,
  labelEn: categoryCode,
  labelAr: categoryCode,
});

describe("finance/pl — revenue is a sum of rows, never a split", () => {
  it("groups real revenue lines and subtracts discounts and refunds", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 100_000), rev("b", 50_000, "Follow-ups"), rev("c", 30_000, "Procedures", false)],
      expenseLines: [],
      discounts: 10_000,
      refunds: 5_000,
    });

    expect(pl.revenue.gross).toBe(165_000);
    expect(pl.revenue.discounts).toBe(10_000);
    expect(pl.revenue.refunds).toBe(5_000);
    expect(pl.revenue.groups).toHaveLength(3);
    expect(pl.revenue.groups[0].amount).toBe(100_000); // sorted desc
  });

  it("ignores zero-amount revenue lines (unpaid appointments)", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 0), rev("b", 40_000)],
      expenseLines: [],
    });
    expect(pl.revenue.groups).toHaveLength(1);
    expect(pl.revenue.gross).toBe(40_000);
  });

  it("clamps negative discount/refund input to zero", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 40_000)],
      expenseLines: [],
      discounts: -5_000,
      refunds: -1_000,
    });
    expect(pl.revenue.gross).toBe(40_000);
  });
});

describe("finance/pl — expense classification", () => {
  it("puts clinical costs in COGS and keeps them out of opex", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 500_000)],
      expenseLines: [
        exp("supplies", 60_000, "VARIABLE", true, "SUPPLIES"),
        exp("lab", 40_000, "VARIABLE", true, "LAB"),
        exp("rent", 120_000, "FIXED", false, "RENT"),
      ],
    });

    expect(pl.cogs.total).toBe(100_000);
    expect(pl.fixedOverhead.total).toBe(120_000);
    expect(pl.totalOperatingExpenses).toBe(120_000);
    expect(pl.grossProfit).toBe(400_000);
    expect(pl.netProfit).toBe(280_000);
  });

  it("buckets FIXED, SEMI_VARIABLE and STEP_FIXED into fixed overhead", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 1_000_000)],
      expenseLines: [
        exp("r", 100_000, "FIXED", false, "RENT"),
        exp("u", 20_000, "SEMI_VARIABLE", false, "UTILITIES"),
        exp("m", 30_000, "STEP_FIXED", false, "MAINTENANCE"),
      ],
    });
    expect(pl.fixedOverhead.total).toBe(150_000);
    expect(pl.variableOpex.total).toBe(0);
  });

  it("buckets VARIABLE and TAX into variable opex", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 1_000_000)],
      expenseLines: [
        exp("s", 40_000, "VARIABLE", false, "MISC"),
        exp("t", 10_000, "TAX", false, "TAXES"),
      ],
    });
    expect(pl.variableOpex.total).toBe(50_000);
    expect(pl.fixedOverhead.total).toBe(0);
  });

  it("reports CAPEX separately and never nets it from profit", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 1_000_000)],
      expenseLines: [exp("device", 300_000, "CAPEX", false, "CAPEX")],
    });
    expect(pl.capex.total).toBe(300_000);
    expect(pl.totalOperatingExpenses).toBe(0);
    expect(pl.netProfit).toBe(1_000_000);
    expect(pl.totalExpensesAll).toBe(300_000);
  });

  it("merges repeated rows of one category into a single line", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 1_000_000)],
      expenseLines: [
        exp("u1", 15_000, "SEMI_VARIABLE", false, "UTILITIES"),
        exp("u2", 25_000, "SEMI_VARIABLE", false, "UTILITIES"),
      ],
    });
    expect(pl.fixedOverhead.items).toHaveLength(1);
    expect(pl.fixedOverhead.items[0].amount).toBe(40_000);
  });

  it("returns null margins instead of NaN when there is no revenue", () => {
    const pl = computeProfitAndLoss({ revenueLines: [], expenseLines: [exp("r", 100, "FIXED", false, "RENT")] });
    expect(pl.grossMarginPct).toBeNull();
    expect(pl.netMarginPct).toBeNull();
    expect(pl.netProfit).toBe(-100);
  });

  it("computes margins to one decimal", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 300_000)],
      expenseLines: [exp("s", 60_000, "VARIABLE", true, "SUPPLIES")],
    });
    expect(pl.grossMarginPct).toBe(80);
    expect(pl.netMarginPct).toBe(80);
  });
});

describe("finance/pl — alerts", () => {
  it("warns when COGS exceeds 40% of revenue", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 100_000)],
      expenseLines: [exp("s", 50_000, "VARIABLE", true, "SUPPLIES")],
    });
    expect(pnlAlerts(pl).map((a) => a.code)).toContain("COGS_HIGH");
  });

  it("warns on a net loss", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 100_000)],
      expenseLines: [exp("r", 150_000, "FIXED", false, "RENT")],
    });
    expect(pnlAlerts(pl).map((a) => a.code)).toContain("NET_LOSS");
  });

  it("stays silent on a healthy month", () => {
    const pl = computeProfitAndLoss({
      revenueLines: [rev("a", 500_000)],
      expenseLines: [exp("s", 50_000, "VARIABLE", true, "SUPPLIES"), exp("r", 100_000, "FIXED", false, "RENT")],
    });
    expect(pnlAlerts(pl)).toHaveLength(0);
  });
});

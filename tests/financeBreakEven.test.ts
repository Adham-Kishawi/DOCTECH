import { describe, expect, it } from "vitest";
import { computeBreakEven, DEFAULT_WORKING_DAYS } from "@/lib/finance/breakEven";

describe("finance/breakEven — computable case", () => {
  it("derives per-visit figures and the visit count that covers fixed cost", () => {
    // 10 visits, 1,000 EGP revenue each, 400 EGP direct cost → 600 contribution.
    const result = computeBreakEven({
      revenue: 1_000_000, // piastres
      visits: 10,
      cogs: 400_000,
      fixedMonthly: 1_500_000,
      workingDays: 30,
    });

    expect(result.computable).toBe(true);
    expect(result.avgRevenuePerVisit).toBe(100_000);
    expect(result.directCostPerVisit).toBe(40_000);
    expect(result.contributionPerVisit).toBe(60_000);
    expect(result.contributionMarginPct).toBe(60);
    // 1,500,000 ÷ 60,000 = 25 visits.
    expect(result.breakEvenVisits).toBe(25);
    expect(result.breakEvenVisitsPerDay).toBe(1); // ceil(25/30)
  });

  it("defaults to 30 working days and labels the assumption", () => {
    const result = computeBreakEven({
      revenue: 3_000_000,
      visits: 10,
      cogs: 0,
      fixedMonthly: 600_000,
    });
    expect(result.workingDays).toBe(DEFAULT_WORKING_DAYS);
    expect(result.breakEvenVisitsPerDay).toBe(1); // ceil(2/30) = 1
  });

  it("rounds per-visit figures to whole piastres", () => {
    const result = computeBreakEven({
      revenue: 100_001, // 1000.01 EGP over 3 visits
      visits: 3,
      cogs: 1,
      fixedMonthly: 100,
    });
    expect(result.avgRevenuePerVisit).toBe(33_334); // Math.round(100001/3)
    expect(result.computable).toBe(true);
  });
});

describe("finance/breakEven — refuses to invent an answer", () => {
  it("is not computable with zero visits", () => {
    const result = computeBreakEven({ revenue: 0, visits: 0, cogs: 0, fixedMonthly: 100_000 });
    expect(result.computable).toBe(false);
    expect(result.reason).toBe("NO_VISITS");
    expect(result.breakEvenVisits).toBeNull();
    expect(result.avgRevenuePerVisit).toBeNull();
  });

  it("is not computable when contribution is zero or negative", () => {
    const equal = computeBreakEven({
      revenue: 100_000,
      visits: 10,
      cogs: 100_000,
      fixedMonthly: 50_000,
    });
    expect(equal.computable).toBe(false);
    expect(equal.reason).toBe("NO_CONTRIBUTION");
    expect(equal.contributionPerVisit).toBe(0);

    const loss = computeBreakEven({
      revenue: 100_000,
      visits: 10,
      cogs: 200_000,
      fixedMonthly: 50_000,
    });
    expect(loss.computable).toBe(false);
    expect(loss.reason).toBe("NO_CONTRIBUTION");
    expect(loss.contributionPerVisit).toBeLessThan(0);
  });

  it("is not computable without a fixed-cost base", () => {
    const result = computeBreakEven({
      revenue: 500_000,
      visits: 10,
      cogs: 100_000,
      fixedMonthly: 0,
    });
    expect(result.computable).toBe(false);
    expect(result.reason).toBe("NO_FIXED_COST");
    // Per-visit figures are still real measurements.
    expect(result.contributionPerVisit).toBe(40_000);
  });
});

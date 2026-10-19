import { describe, expect, it } from "vitest";
import {
  computeInvoiceTotals,
  formatExpenseNumber,
  formatInvoiceNumber,
  lineTotal,
  monthLabel,
  statusFor,
  type InvoiceItemInput,
} from "@/lib/finance/invoice";

const item = (unitPrice: number, quantity = 1, descriptionAr = "كشف"): InvoiceItemInput => ({
  itemType: "CONSULTATION",
  descriptionAr,
  quantity,
  unitPrice,
});

describe("finance/invoice — line totals", () => {
  it("multiplies unit price by quantity", () => {
    expect(lineTotal(item(15_000, 3))).toBe(45_000);
  });

  it("treats missing or fractional quantity as at least one unit", () => {
    expect(lineTotal(item(10_000, 0))).toBe(10_000);
    expect(lineTotal(item(10_000, 2.7))).toBe(20_000); // floor
  });

  it("clamps non-finite prices to zero", () => {
    expect(lineTotal(item(NaN))).toBe(0);
  });
});

describe("finance/invoice — totals are derived, never trusted", () => {
  it("sums the lines into the subtotal", () => {
    const totals = computeInvoiceTotals({ items: [item(10_000, 2), item(5_000)] });
    expect(totals.subtotal).toBe(25_000);
    expect(totals.total).toBe(25_000);
    expect(totals.status).toBe("ISSUED");
  });

  it("applies a percentage discount to the subtotal", () => {
    const totals = computeInvoiceTotals({
      items: [item(100_000)],
      discountType: "PERCENTAGE",
      discountValue: 10,
    });
    expect(totals.discountAmount).toBe(10_000);
    expect(totals.total).toBe(90_000);
  });

  it("never lets a fixed discount exceed the subtotal", () => {
    const totals = computeInvoiceTotals({
      items: [item(30_000)],
      discountType: "FIXED",
      discountValue: 50_000,
    });
    expect(totals.discountAmount).toBe(30_000);
    expect(totals.total).toBe(0);
  });

  it("taxes the discounted amount, not the subtotal", () => {
    const totals = computeInvoiceTotals({
      items: [item(100_000)],
      discountType: "PERCENTAGE",
      discountValue: 10,
      taxRate: 14,
    });
    // taxable = 90,000 → VAT 12,600 → total 102,600
    expect(totals.taxAmount).toBe(12_600);
    expect(totals.total).toBe(102_600);
  });

  it("caps paidAmount at the total and keeps balance_due non-negative", () => {
    const totals = computeInvoiceTotals({ items: [item(50_000)], paidAmount: 80_000 });
    expect(totals.paidAmount).toBe(50_000);
    expect(totals.balanceDue).toBe(0);
    expect(totals.status).toBe("PAID");
  });
});

describe("finance/invoice — status follows the money", () => {
  it("derives ISSUED, PARTIALLY_PAID and PAID from paid_amount", () => {
    expect(statusFor(100, 0)).toBe("ISSUED");
    expect(statusFor(100, 50)).toBe("PARTIALLY_PAID");
    expect(statusFor(100, 100)).toBe("PAID");
  });

  it("treats a zero-total invoice as ISSUED, not PAID", () => {
    expect(statusFor(0, 0)).toBe("ISSUED");
  });

  it("honours forced terminal states", () => {
    expect(statusFor(100, 100, "CANCELLED")).toBe("CANCELLED");
    expect(statusFor(100, 0, "REFUNDED")).toBe("REFUNDED");
    expect(statusFor(100, 0, "DRAFT")).toBe("DRAFT");
  });

  it("surfaces the derived status from computeInvoiceTotals", () => {
    expect(computeInvoiceTotals({ items: [item(40_000)], paidAmount: 10_000 }).status).toBe("PARTIALLY_PAID");
    expect(computeInvoiceTotals({ items: [item(40_000)], paidAmount: 40_000 }).status).toBe("PAID");
  });
});

describe("finance/invoice — numbering and labels", () => {
  it("pads sequence numbers to five digits", () => {
    expect(formatInvoiceNumber("2026-10", 42)).toBe("INV-2026-10-00042");
    expect(formatExpenseNumber("2026-10", 7)).toBe("EXP-2026-10-00007");
  });

  it("labels months in English and Arabic", () => {
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(monthLabel("2026-10", "ar")).toBe("أكتوبر 2026");
    expect(monthLabel("bad-key")).toBe("bad-key");
  });
});

/**
 * Invoice arithmetic — pure, integer piastres, no I/O.
 *
 * Rules encoded here (plan §5.5):
 *   * totals are derived from the line items, never supplied by the client;
 *   * a discount can never exceed the subtotal;
 *   * status follows from `paid_amount` instead of being typed in;
 *   * `balance_due` is always `total − paid`, so it cannot drift.
 */

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";
export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "REFUNDED";

export type InvoiceItemType =
  | "CONSULTATION"
  | "PROCEDURE"
  | "LAB_TEST"
  | "MEDICATION"
  | "REPORT"
  | "OTHER";

export interface InvoiceItemInput {
  itemType: InvoiceItemType;
  descriptionAr: string;
  descriptionEn?: string | null;
  quantity: number;
  /** Piastres. */
  unitPrice: number;
  appointmentTypeId?: string | null;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
}

const safeInt = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

export function lineTotal(item: InvoiceItemInput): number {
  const quantity = Math.max(1, Math.floor(item.quantity || 1));
  return safeInt(item.unitPrice) * quantity;
}

export function computeInvoiceTotals(options: {
  items: InvoiceItemInput[];
  discountType?: DiscountType;
  /** Percentage (0-100) or piastres, depending on `discountType`. */
  discountValue?: number;
  /** Percent, e.g. 14 for 14%. */
  taxRate?: number;
  paidAmount?: number;
}): InvoiceTotals {
  const subtotal = options.items.reduce((sum, item) => sum + lineTotal(item), 0);

  const discountType = options.discountType ?? "NONE";
  const discountValue = safeInt(options.discountValue ?? 0);

  let discountAmount = 0;
  if (discountType === "PERCENTAGE") {
    const percent = Math.min(100, Math.max(0, Number(options.discountValue) || 0));
    discountAmount = Math.round((subtotal * percent) / 100);
  } else if (discountType === "FIXED") {
    discountAmount = Math.min(discountValue, subtotal);
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  const taxRate = Math.max(0, Number(options.taxRate) || 0);
  const taxAmount = Math.round((taxable * taxRate) / 100);
  const total = taxable + taxAmount;
  const paidAmount = Math.min(safeInt(options.paidAmount ?? 0), total);
  const balanceDue = Math.max(0, total - paidAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    paidAmount,
    balanceDue,
    status: statusFor(total, paidAmount),
  };
}

export function statusFor(total: number, paidAmount: number, force?: InvoiceStatus): InvoiceStatus {
  if (force === "CANCELLED" || force === "REFUNDED" || force === "DRAFT") return force;
  if (total <= 0) return "ISSUED";
  if (paidAmount <= 0) return "ISSUED";
  if (paidAmount < total) return "PARTIALLY_PAID";
  return "PAID";
}

/** `INV-2026-10-00042` — allocated by the `next_counter_value` SQL function. */
export const formatInvoiceNumber = (periodKey: string, sequence: number): string =>
  `INV-${periodKey}-${String(sequence).padStart(5, "0")}`;

/** `EXP-2026-10-00042` — same allocator, different kind. */
export const formatExpenseNumber = (periodKey: string, sequence: number): string =>
  `EXP-${periodKey}-${String(sequence).padStart(5, "0")}`;

export const MONTHS: Record<string, { en: string; ar: string }> = {
  "01": { en: "January", ar: "يناير" },
  "02": { en: "February", ar: "فبراير" },
  "03": { en: "March", ar: "مارس" },
  "04": { en: "April", ar: "أبريل" },
  "05": { en: "May", ar: "مايو" },
  "06": { en: "June", ar: "يونيو" },
  "07": { en: "July", ar: "يوليو" },
  "08": { en: "August", ar: "أغسطس" },
  "09": { en: "September", ar: "سبتمبر" },
  "10": { en: "October", ar: "أكتوبر" },
  "11": { en: "November", ar: "نوفمبر" },
  "12": { en: "December", ar: "ديسمبر" },
};

export function monthLabel(monthKey: string, locale: "ar" | "en" = "en"): string {
  const [year, month] = monthKey.split("-");
  const name = MONTHS[month];
  if (!name) return monthKey;
  return locale === "ar" ? `${name.ar} ${year}` : `${name.en} ${year}`;
}

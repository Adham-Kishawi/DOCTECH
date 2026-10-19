import { NextResponse } from "next/server";
import { toErrorResponse, requireSession, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres } from "@/lib/money";

export const dynamic = "force-dynamic";

const missingTable = (message?: string): boolean =>
  /does not exist|PGRST205|42P01|schema cache/i.test(message || "");

const money = (piastres: number): string =>
  new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    fromPiastres(piastres)
  );

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * GET /api/finance/invoices/[id]/pdf — the invoice as a print-ready HTML
 * document. The browser's own "Save as PDF" produces the file, so this route
 * stays dependency-free and the layout always matches the data it just read.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_VIEW });

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*, patients(name, phone), clinics(name)")
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (error) {
      if (missingTable(error.message)) throw new Error("Invoices table missing — apply migration 0005.");
      throw error;
    }
    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const { data: items } = await supabaseAdmin
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at");

    const patient = invoice.patients as { name?: string; phone?: string } | null;
    const clinic = invoice.clinics as { name?: string } | null;

    const rowsHtml = ((items as Record<string, unknown>[] | null) || [])
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.description_ar)}${item.description_en ? `<div class="muted">${escapeHtml(item.description_en)}</div>` : ""}</td>
          <td class="num">${Number(item.quantity) || 1}</td>
          <td class="num">${money(Number(item.unit_price) || 0)}</td>
          <td class="num">${money(Number(item.line_total) || 0)}</td>
        </tr>`
      )
      .join("");

    const discountRow =
      Number(invoice.discount_amount) > 0
        ? `<tr><td colspan="3">Discount</td><td class="num">(${money(Number(invoice.discount_amount))})</td></tr>`
        : "";
    const taxRow =
      Number(invoice.tax_amount) > 0
        ? `<tr><td colspan="3">VAT (${escapeHtml(invoice.tax_rate)}%)</td><td class="num">${money(Number(invoice.tax_amount))}</td></tr>`
        : "";

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(invoice.invoice_number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #0f172a; margin: 40px; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1a4b8c; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 800; color: #1a4b8c; }
  .muted { color: #64748b; font-size: 12px; }
  .meta { text-align: right; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 16px; margin-left: auto; width: 320px; }
  .totals td { border: none; padding: 4px 8px; font-size: 13px; }
  .grand { font-weight: 800; font-size: 15px; border-top: 2px solid #0f172a !important; }
  .footer { margin-top: 40px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
  .sign { margin-top: 48px; border-top: 1px dotted #94a3b8; width: 220px; text-align: center; padding-top: 6px; font-size: 12px; color: #64748b; }
  @media print { body { margin: 12mm; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${escapeHtml(clinic?.name || "DOCTECH Clinic")}</div>
      <div class="muted">Medical invoice · فاتورة طبية</div>
    </div>
    <div class="meta">
      <div><strong>${escapeHtml(invoice.invoice_number)}</strong></div>
      <div class="muted">Issue date: ${escapeHtml(invoice.issue_date)}</div>
      ${invoice.due_date ? `<div class="muted">Due: ${escapeHtml(invoice.due_date)}</div>` : ""}
      <div class="muted">Status: ${escapeHtml(invoice.status)}</div>
    </div>
  </div>

  <div>
    <strong>Patient:</strong> ${escapeHtml(patient?.name || invoice.patient_id)}
    ${patient?.phone ? ` · <span class="muted">${escapeHtml(patient.phone)}</span>` : ""}
  </div>

  <table>
    <thead>
      <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit (EGP)</th><th class="num">Total (EGP)</th></tr>
    </thead>
    <tbody>${rowsHtml || `<tr><td colspan="4" class="muted">No line items</td></tr>`}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="num">${money(Number(invoice.subtotal))}</td></tr>
    ${discountRow}
    ${taxRow}
    <tr class="grand"><td>Total</td><td class="num">${money(Number(invoice.total))}</td></tr>
    <tr><td>Paid</td><td class="num">${money(Number(invoice.paid_amount))}</td></tr>
    <tr><td>Balance due</td><td class="num">${money(Number(invoice.balance_due))}</td></tr>
  </table>

  <div class="footer">
    <div>Payment is due within 7 days of issue unless otherwise agreed.</div>
    <div class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
  </div>

  <div class="sign">Authorized signature · توقيع معتمد</div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error, "invoice pdf error:");
  }
}

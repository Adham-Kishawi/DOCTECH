"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  FileText,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  X,
  Check,
  CreditCard,
  Banknote,
  Landmark,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { computeInvoiceTotals, type InvoiceItemType } from "@/lib/finance/invoice";
import type { InvoiceDto } from "@/types/index";

const EGP = (n: number): string => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const STATUS_STYLE: Record<string, { en: string; ar: string; cls: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة", cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
  ISSUED: { en: "Issued", ar: "صادرة", cls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" },
  PARTIALLY_PAID: { en: "Partially paid", ar: "سداد جزئي", cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" },
  PAID: { en: "Paid", ar: "مدفوعة", cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
  OVERDUE: { en: "Overdue", ar: "متأخرة", cls: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة", cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 line-through" },
  REFUNDED: { en: "Refunded", ar: "مسترجعة", cls: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" },
};

const ITEM_TYPES: { id: InvoiceItemType; en: string; ar: string }[] = [
  { id: "CONSULTATION", en: "Consultation", ar: "كشف" },
  { id: "PROCEDURE", en: "Procedure", ar: "إجراء" },
  { id: "LAB_TEST", en: "Lab test", ar: "تحليل" },
  { id: "MEDICATION", en: "Medication", ar: "دواء" },
  { id: "REPORT", en: "Report", ar: "تقرير" },
  { id: "OTHER", en: "Other", ar: "أخرى" },
];

const METHODS = [
  { id: "CASH", en: "Cash", ar: "نقدي", icon: Banknote },
  { id: "CARD", en: "Card", ar: "فيزا", icon: CreditCard },
  { id: "BANK_TRANSFER", en: "Transfer", ar: "تحويل", icon: Landmark },
] as const;

interface DraftItem {
  itemType: InvoiceItemType;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface PatientOption {
  id: string;
  name: string;
  phone: string;
}

const monthOptions = (isRTL: boolean): { key: string; label: string }[] => {
  const now = new Date();
  const options: { key: string; label: string }[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({
      key,
      label: d.toLocaleDateString(isRTL ? "ar-EG" : "en-US", { year: "numeric", month: "long" }),
    });
  }
  return options;
};

/** Plain fetcher (no component state) — used by the effect and by action refreshes. */
async function getInvoices(
  month: string
): Promise<{ ok: boolean; unavailable: boolean; invoices: InvoiceDto[] }> {
  const res = await fetch(`/api/finance/invoices?month=${encodeURIComponent(month)}`);
  if (res.status === 503) return { ok: false, unavailable: true, invoices: [] };
  const data = await res.json().catch(() => ({}));
  return { ok: Boolean(data.success), unavailable: false, invoices: data.invoices || [] };
}

export default function DoctorInvoicesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "PAID" | "CLOSED">("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<InvoiceDto | null>(null);
  const [refundTarget, setRefundTarget] = useState<InvoiceDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await getInvoices(selectedMonth);
        if (cancelled) return;
        if (result.unavailable) {
          setUnavailable(true);
          setInvoices([]);
        } else if (result.ok) {
          setInvoices(result.invoices);
          setUnavailable(false);
        } else {
          toast.error(isRTL ? "تعذر تحميل الفواتير" : "Failed to load invoices");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("load invoices:", err);
          toast.error(isRTL ? "تعذر تحميل الفواتير" : "Failed to load invoices");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, reloadToken, isRTL]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const open = inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE";
      const closed = inv.status === "CANCELLED" || inv.status === "REFUNDED";
      const statusOk =
        statusFilter === "ALL" ||
        (statusFilter === "OPEN" && open) ||
        (statusFilter === "PAID" && inv.status === "PAID") ||
        (statusFilter === "CLOSED" && closed);
      const searchOk =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.patient?.name || "").toLowerCase().includes(q) ||
        (inv.patient?.phone || "").includes(q);
      return statusOk && searchOk;
    });
  }, [invoices, statusFilter, search]);

  const totals = useMemo(() => {
    const issued = invoices.reduce((s, i) => s + i.total, 0);
    const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
    return { issued, collected, outstanding };
  }, [invoices]);

  const act = async (
    id: string,
    fn: () => Promise<Response>,
    okMessage: string
  ) => {
    try {
      setBusyId(id);
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشلت العملية" : "Action failed"));
        return;
      }
      toast.success(okMessage);
      reload();
    } catch (err) {
      console.error("invoice action:", err);
      toast.error(isRTL ? "فشلت العملية" : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (inv: InvoiceDto) => {
    if (!confirm(isRTL ? `إلغاء الفاتورة ${inv.invoiceNumber}؟` : `Cancel invoice ${inv.invoiceNumber}?`)) return;
    act(
      inv.id,
      () =>
        fetch(`/api/finance/invoices/${encodeURIComponent(inv.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CANCEL" }),
        }),
      isRTL ? "تم إلغاء الفاتورة" : "Invoice cancelled"
    );
  };

  const openPrint = (inv: InvoiceDto) => {
    window.open(`/api/finance/invoices/${encodeURIComponent(inv.id)}/pdf`, "_blank");
  };

  const months = monthOptions(isRTL);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-2">
            <FileText size={14} />
            {isRTL ? "الفواتير والتحصيل" : "Invoices & Collections"}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isRTL ? "فواتير العيادة" : "Clinic Invoices"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? "إصدار الفواتير، تحصيل المدفوعات، الاسترجاع، والطباعة — كل الأرقام محسوبة من البنود"
              : "Issue invoices, collect payments, refund and print — every total is computed from the line items"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setLoading(true);
                setSelectedMonth(e.target.value);
              }}
              aria-label={isRTL ? "اختر الشهر" : "Select month"}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-4 pe-9 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {months.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar size={14} className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-md shadow-blue-900/10 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{isRTL ? "فاتورة جديدة" : "New Invoice"}</span>
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { labelEn: "Issued this month", labelAr: "صادر هذا الشهر", value: totals.issued, cls: "text-slate-900 dark:text-white" },
          { labelEn: "Collected", labelAr: "المحصّل", value: totals.collected, cls: "text-emerald-600 dark:text-emerald-400" },
          { labelEn: "Outstanding", labelAr: "المتبقي", value: totals.outstanding, cls: "text-rose-600 dark:text-rose-400" },
        ].map((kpi) => (
          <div key={kpi.labelEn} className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isRTL ? kpi.labelAr : kpi.labelEn}
            </span>
            <p className={`text-xl sm:text-2xl font-black mt-1 font-mono ${kpi.cls}`}>
              {EGP(kpi.value)} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث برقم الفاتورة أو اسم المريض..." : "Search by invoice # or patient..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["ALL", "OPEN", "PAID", "CLOSED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {filter === "ALL"
                ? isRTL ? "الكل" : "All"
                : filter === "OPEN"
                ? isRTL ? "مستحقة" : "Open"
                : filter === "PAID"
                ? isRTL ? "مدفوعة" : "Paid"
                : isRTL ? "مغلقة" : "Closed"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {unavailable ? (
        <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {isRTL
            ? "جدول الفواتير غير مطبَّق على قاعدة البيانات بعد — أضِف ترحيل 0005 (يُطبَّق يدوياً في المرحلة 9)."
            : "The invoices table is not applied to the database yet — add migration 0005 (applied manually in Phase 9)."}
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          {isRTL ? "جارٍ تحميل الفواتير..." : "Loading invoices..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold">{isRTL ? "لا توجد فواتير مطابقة" : "No invoices found"}</p>
          <p className="text-xs">{isRTL ? "اضغط «فاتورة جديدة» لإصدار فاتورة للمريض" : "Click “New Invoice” to issue one for a patient"}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filtered.map((inv) => {
            const style = STATUS_STYLE[inv.status] || STATUS_STYLE.ISSUED;
            const canPay = inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE";
            const canRefund = inv.paidAmount > 0 && inv.status !== "CANCELLED" && inv.status !== "REFUNDED";
            const canCancel = canPay;

            return (
              <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.cls}`}>
                      {isRTL ? style.ar : style.en}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {inv.patient?.name || inv.patientId}
                    {inv.patient?.phone ? ` · ${inv.patient.phone}` : ""} · {inv.issueDate}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 flex-wrap">
                  <div className="text-end">
                    <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {EGP(inv.total)} <span className="text-[10px] font-normal text-slate-500">EGP</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {isRTL ? "مدفوع: " : "paid: "}
                      {EGP(inv.paidAmount)} · {isRTL ? "متبقي: " : "due: "}
                      <span className={inv.balanceDue > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                        {EGP(inv.balanceDue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canPay && (
                      <button
                        onClick={() => setPayTarget(inv)}
                        disabled={busyId === inv.id}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isRTL ? "تحصيل" : "Collect"}
                      </button>
                    )}
                    {canRefund && (
                      <button
                        onClick={() => setRefundTarget(inv)}
                        disabled={busyId === inv.id}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isRTL ? "استرجاع" : "Refund"}
                      </button>
                    )}
                    <button
                      onClick={() => openPrint(inv)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#1A4B8C] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                      title={isRTL ? "طباعة / PDF" : "Print / PDF"}
                    >
                      <Printer size={15} />
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(inv)}
                        disabled={busyId === inv.id}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        title={isRTL ? "إلغاء الفاتورة" : "Cancel invoice"}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewOpen && (
        <NewInvoiceModal
          isRTL={isRTL}
          onClose={() => setIsNewOpen(false)}
          onCreated={async () => {
            setIsNewOpen(false);
            reload();
          }}
        />
      )}

      {payTarget && (
        <PaymentModal
          invoice={payTarget}
          isRTL={isRTL}
          onClose={() => setPayTarget(null)}
          onDone={async () => {
            setPayTarget(null);
            reload();
          }}
        />
      )}

      {refundTarget && (
        <RefundModal
          invoice={refundTarget}
          isRTL={isRTL}
          onClose={() => setRefundTarget(null)}
          onDone={async () => {
            setRefundTarget(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New invoice modal                                                    */
/* ------------------------------------------------------------------ */

function NewInvoiceModal({
  isRTL,
  onClose,
  onCreated,
}: {
  isRTL: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [items, setItems] = useState<DraftItem[]>([
    { itemType: "CONSULTATION", description: "", quantity: "1", unitPrice: "" },
  ]);
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/patients?limit=200")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPatients(
            data.data.map((p: { id: string; name: string; phone: string }) => ({
              id: p.id,
              name: p.name,
              phone: p.phone || "",
            }))
          );
        }
      })
      .catch((err) => console.error("load patients:", err));
  }, []);

  const matchedPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients
      .filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q))
      .slice(0, 8);
  }, [patients, patientQuery]);

  const selectedPatient = patients.find((p) => p.id === patientId) || null;

  // Same pure calculator the server uses — the preview cannot drift from the stored totals.
  const preview = useMemo(
    () =>
      computeInvoiceTotals({
        items: items.map((item) => ({
          itemType: item.itemType,
          descriptionAr: item.description || "-",
          quantity: parseInt(item.quantity, 10) || 1,
          unitPrice: Math.round((parseFloat(item.unitPrice) || 0) * 100),
        })),
        discountType,
        discountValue:
          discountType === "PERCENTAGE"
            ? parseFloat(discountValue) || 0
            : Math.round((parseFloat(discountValue) || 0) * 100),
        taxRate: parseFloat(taxRate) || 0,
      }),
    [items, discountType, discountValue, taxRate]
  );

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast.error(isRTL ? "اختر المريض أولاً" : "Select a patient first");
      return;
    }
    const payloadItems = items
      .filter((item) => item.description.trim() && (parseFloat(item.unitPrice) || 0) > 0)
      .map((item) => ({
        itemType: item.itemType,
        descriptionAr: item.description.trim(),
        quantity: parseInt(item.quantity, 10) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));
    if (payloadItems.length === 0) {
      toast.error(isRTL ? "أضِف بنداً واحداً على الأقل" : "Add at least one line item");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          items: payloadItems,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          taxRate: parseFloat(taxRate) || 0,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || (isRTL ? "تعذر إصدار الفاتورة" : "Failed to create invoice"));
        return;
      }
      toast.success(isRTL ? "تم إصدار الفاتورة بنجاح" : "Invoice issued");
      await onCreated();
    } catch (err) {
      console.error("create invoice:", err);
      toast.error(isRTL ? "تعذر إصدار الفاتورة" : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isRTL ? "إصدار فاتورة جديدة" : "Issue New Invoice"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Patient picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <Users size={13} />
                {isRTL ? "المريض *" : "Patient *"}
              </span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPatient.name}</span>
                  {selectedPatient.phone && (
                    <span className="text-slate-500 dark:text-slate-400 font-mono"> · {selectedPatient.phone}</span>
                  )}
                </div>
                <button type="button" onClick={() => setPatientId(null)} className="text-[11px] font-bold text-[#1A4B8C] dark:text-blue-400 cursor-pointer">
                  {isRTL ? "تغيير" : "Change"}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="doctech-input-icon" size={15} />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder={isRTL ? "ابحث بالاسم أو رقم الهاتف..." : "Search by name or phone..."}
                    className="doctech-input !h-10 text-xs"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {matchedPatients.length === 0 ? (
                    <p className="p-3 text-[11px] text-slate-400">{isRTL ? "لا نتائج" : "No matches"}</p>
                  ) : (
                    matchedPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPatientId(p.id)}
                        className="w-full text-start p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        {p.phone && <span className="text-slate-400 font-mono"> · {p.phone}</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Line items */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isRTL ? "بنود الفاتورة *" : "Line Items *"}
            </label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-1.5 items-center">
                  <select
                    value={item.itemType}
                    onChange={(e) => updateItem(index, { itemType: e.target.value as InvoiceItemType })}
                    className="col-span-3 doctech-input !h-9 text-[11px]"
                    aria-label={isRTL ? "النوع" : "Type"}
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isRTL ? t.ar : t.en}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder={isRTL ? "الوصف" : "Description"}
                    className="col-span-4 doctech-input !h-9 text-[11px]"
                    required
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    className="col-span-1 doctech-input !h-9 text-[11px] text-center"
                    aria-label={isRTL ? "الكمية" : "Qty"}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                    placeholder={isRTL ? "السعر" : "Unit EGP"}
                    className="col-span-3 doctech-input !h-9 text-[11px] font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={items.length === 1}
                    className="col-span-1 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, { itemType: "OTHER", description: "", quantity: "1", unitPrice: "" }])}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#1A4B8C] dark:text-blue-400 cursor-pointer"
            >
              <Plus size={13} /> {isRTL ? "إضافة بند" : "Add line"}
            </button>
          </div>

          {/* Discount / tax */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "نوع الخصم" : "Discount type"}</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                className="doctech-input !h-10 text-xs"
              >
                <option value="NONE">{isRTL ? "بدون" : "None"}</option>
                <option value="PERCENTAGE">{isRTL ? "نسبة %" : "Percentage %"}</option>
                <option value="FIXED">{isRTL ? "مبلغ ثابت" : "Fixed amount"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "قيمة الخصم" : "Discount value"}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                disabled={discountType === "NONE"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="doctech-input !h-10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "ضريبة %" : "Tax rate %"}</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="doctech-input !h-10 text-xs font-mono"
              />
            </div>
          </div>

          {/* Live totals — computed by the same lib as the server */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono">
            <div className="flex justify-between text-slate-500">
              <span>{isRTL ? "الإجمالي الفرعي" : "Subtotal"}</span>
              <span>{EGP(preview.subtotal / 100)} EGP</span>
            </div>
            {preview.discountAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>{isRTL ? "الخصم" : "Discount"}</span>
                <span>({EGP(preview.discountAmount / 100)})</span>
              </div>
            )}
            {preview.taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>{isRTL ? "الضريبة" : "VAT"}</span>
                <span>{EGP(preview.taxAmount / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>{isRTL ? "الإجمالي" : "Total"}</span>
              <span>{EGP(preview.total / 100)} EGP</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "ملاحظات" : "Notes"}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#1A4B8C] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving || !patientId}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={15} />
              <span>{saving ? (isRTL ? "جارٍ الإصدار..." : "Issuing...") : isRTL ? "إصدار الفاتورة" : "Issue Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payment modal                                                        */
/* ------------------------------------------------------------------ */

function PaymentModal({
  invoice,
  isRTL,
  onClose,
  onDone,
}: {
  invoice: InvoiceDto;
  isRTL: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [amount, setAmount] = useState(invoice.balanceDue > 0 ? String(invoice.balanceDue) : "");
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("CASH");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/finance/invoices/${encodeURIComponent(invoice.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PAYMENT", amount: value, paymentMethod: method, reference: reference.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || (isRTL ? "تعذر تسجيل الدفعة" : "Failed to record payment"));
        return;
      }
      toast.success(isRTL ? "تم تسجيل الدفعة بنجاح" : "Payment recorded");
      await onDone();
    } catch (err) {
      console.error("record payment:", err);
      toast.error(isRTL ? "تعذر تسجيل الدفعة" : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            {isRTL ? "تحصيل دفعة — " : "Collect payment — "}
            {invoice.invoiceNumber}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? `المبلغ المتبقي (${EGP(invoice.balanceDue)} ج.م) *` : `Amount due (${EGP(invoice.balanceDue)} EGP) *`}
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="doctech-input !h-11 text-base font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isRTL ? "طريقة الدفع" : "Payment method"}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      method === pm.id
                        ? "border-[#1A4B8C] dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-[#1A4B8C] dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{isRTL ? pm.ar : pm.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "مرجع (شيك/تحويل)" : "Reference (check/transfer #)"}</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="doctech-input !h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
            >
              {isRTL ? "تسجيل الدفعة" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Refund modal                                                         */
/* ------------------------------------------------------------------ */

function RefundModal({
  invoice,
  isRTL,
  onClose,
  onDone,
}: {
  invoice: InvoiceDto;
  isRTL: boolean;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("CASH");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    if (value > invoice.paidAmount) {
      toast.error(isRTL ? "لا يمكن استرجاع أكثر من المبلغ المدفوع" : "Cannot refund more than the paid amount");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/finance/invoices/${encodeURIComponent(invoice.id)}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, reason: reason.trim() || undefined, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || (isRTL ? "تعذر تسجيل الاسترجاع" : "Failed to record refund"));
        return;
      }
      toast.success(isRTL ? "تم تسجيل الاسترجاع" : "Refund recorded");
      await onDone();
    } catch (err) {
      console.error("refund:", err);
      toast.error(isRTL ? "تعذر تسجيل الاسترجاع" : "Failed to record refund");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
            {isRTL ? "استرجاع — " : "Refund — "}
            {invoice.invoiceNumber}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? `المبلغ (المحصّل: ${EGP(invoice.paidAmount)} ج.م) *` : `Amount (paid: ${EGP(invoice.paidAmount)} EGP) *`}
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="doctech-input !h-11 text-base font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{isRTL ? "طريقة الاسترجاع" : "Refund method"}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      method === pm.id
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{isRTL ? pm.ar : pm.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{isRTL ? "سبب الاسترجاع" : "Reason"}</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRTL ? "مثال: إلغاء الكشف" : "e.g. visit cancelled"}
              className="doctech-input !h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
            >
              {isRTL ? "تسجيل الاسترجاع" : "Record Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

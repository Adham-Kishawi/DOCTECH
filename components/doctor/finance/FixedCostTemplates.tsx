"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Repeat,
  Play,
  Archive,
  Pencil,
  AlertTriangle,
  CalendarClock,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ExpenseCategoryOption,
  ExpenseTemplateDto,
  FixedCostBreakdownDto,
} from "@/types/index";

interface TemplatesPayload {
  success: boolean;
  templates: ExpenseTemplateDto[];
  fixedCosts: FixedCostBreakdownDto;
  unavailable?: boolean;
}

const FREQUENCIES: ExpenseTemplateDto["frequency"][] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
];
const POSTING_MODES: ExpenseTemplateDto["postingMode"][] = ["AUTO", "CONFIRM", "MANUAL"];

const FREQ_LABEL: Record<string, { en: string; ar: string }> = {
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  BIWEEKLY: { en: "Every 2 weeks", ar: "كل أسبوعين" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  ANNUAL: { en: "Annual", ar: "سنوي" },
};
const MODE_LABEL: Record<string, { en: string; ar: string }> = {
  AUTO: { en: "Auto-post", ar: "ترحيل تلقائي" },
  CONFIRM: { en: "Needs confirm", ar: "يحتاج تأكيد" },
  MANUAL: { en: "Manual only", ar: "يدوي فقط" },
};

const EGP = (n: number): string => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const amend: Record<string, string> = { WEEKLY: "½", BIWEEKLY: "½", MONTHLY: "", QUARTERLY: "÷3", ANNUAL: "÷12" };

type FormState = {
  id: string | null;
  titleEn: string;
  titleAr: string;
  amount: string;
  categoryId: string;
  frequency: ExpenseTemplateDto["frequency"];
  dueDayOfMonth: string;
  payee: string;
  contractRef: string;
  paymentMethod: string;
  postingMode: ExpenseTemplateDto["postingMode"];
};

const emptyForm = (): FormState => ({
  id: null,
  titleEn: "",
  titleAr: "",
  amount: "",
  categoryId: "",
  frequency: "MONTHLY",
  dueDayOfMonth: "",
  payee: "",
  contractRef: "",
  paymentMethod: "BANK_TRANSFER",
  postingMode: "AUTO",
});

/**
 * Recurring fixed-cost templates (plan §5.2.2 / §5.2.3).
 *
 * The same API that a cron would call ("Run due now") is exposed as a button,
 * so a doctor can post this month's rent/salaries on demand and watch the
 * amortized monthly total update. Posting is idempotent server-side.
 */
export function FixedCostTemplates({ isRTL }: { isRTL: boolean }) {
  const [templates, setTemplates] = useState<ExpenseTemplateDto[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCostBreakdownDto | null>(null);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const load = useCallback(async () => {
    try {
      const [tplRes, catRes] = await Promise.all([
        fetch("/api/finance/templates"),
        fetch("/api/finance/categories"),
      ]);
      const [tplData, catData] = await Promise.all([
        tplRes.json().catch(() => ({})) as Promise<Partial<TemplatesPayload>>,
        catRes.json().catch(() => ({})) as Promise<{ success?: boolean; categories?: ExpenseCategoryOption[] }>,
      ]);
      if (tplData?.success) {
        setUnavailable(Boolean(tplData.unavailable || tplData.fixedCosts?.unavailable));
        setTemplates(tplData.templates || []);
        setFixedCosts(tplData.fixedCosts || { rows: [], monthlyTotal: 0, unavailable: false });
      }
      if (catData?.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      }
    } catch (err) {
      console.error("load fixed-cost templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run();
  }, [load]);

  const catName = (id: string | null): string => {
    if (!id) return isRTL ? "بدون تصنيف" : "Uncategorized";
    const c = categories.find((x) => x.id === id);
    if (!c) return id;
    return isRTL ? c.nameAr : c.nameEn;
  };

  const submit = async () => {
    if (!form) return;
    const amount = parseFloat(form.amount);
    if (!form.titleEn.trim() || !form.titleAr.trim() || !amount || amount <= 0) {
      toast.error(isRTL ? "أدخل اسم القالب والمبلغ" : "Enter a title and a positive amount");
      return;
    }
    const body: Record<string, unknown> = {
      titleEn: form.titleEn.trim(),
      titleAr: form.titleAr.trim(),
      amount,
      categoryId: form.categoryId || null,
      frequency: form.frequency,
      dueDayOfMonth: form.dueDayOfMonth ? parseInt(form.dueDayOfMonth, 10) : null,
      payee: form.payee.trim() || null,
      contractRef: form.contractRef.trim() || null,
      paymentMethod: form.paymentMethod,
      postingMode: form.postingMode,
    };
    try {
      setBusy(true);
      const res = await fetch("/api/finance/templates", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...body } : body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشل الحفظ" : "Save failed"));
        return;
      }
      toast.success(form.id ? (isRTL ? "تم التحديث" : "Template updated") : isRTL ? "تم إنشاء القالب" : "Template created");
      setForm(null);
      await load();
    } catch (err) {
      console.error("save template:", err);
      toast.error(isRTL ? "فشل الحفظ" : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const archive = async (id: string) => {
    try {
      setBusy(true);
      const res = await fetch(`/api/finance/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشل الأرشفة" : "Archive failed"));
        return;
      }
      toast.success(isRTL ? "تم أرشفة القالب" : "Template archived");
      await load();
    } catch (err) {
      console.error("archive template:", err);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (tpl: ExpenseTemplateDto) => {
    try {
      setBusy(true);
      const res = await fetch("/api/finance/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tpl.id, isActive: !tpl.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشل التحديث" : "Update failed"));
        return;
      }
      await load();
    } catch (err) {
      console.error("toggle template:", err);
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    try {
      setBusy(true);
      const res = await fetch("/api/finance/templates/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشل الترحيل" : "Run failed"));
        return;
      }
      const r = data.result || {};
      if (r.unavailable) {
        toast.warning(isRTL ? "ترحيل 0005 غير مطبَّق بعد" : "Migration 0005 not applied yet");
      } else {
        toast.success(
          isRTL
            ? `تم ترحيل ${r.posted?.length || 0} مصروف · ${r.pending?.length || 0} بانتظار التأكيد`
            : `Posted ${r.posted?.length || 0} · ${r.pending?.length || 0} pending`
        );
      }
      await load();
    } catch (err) {
      console.error("run templates:", err);
      toast.error(isRTL ? "فشل الترحيل" : "Run failed");
    } finally {
      setBusy(false);
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive);
  const monthlyTotal = fixedCosts?.monthlyTotal ?? 0;

  return (
    <div className="space-y-5">
      {/* Summary + run */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Repeat size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">{isRTL ? "التكلفة الثابتة الشهرية" : "Monthly fixed cost"}</p>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {EGP(monthlyTotal)} <span className="text-xs font-bold text-slate-400">EGP</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRTL
                ? `${activeTemplates.length} قالب نشط (المبالغ مُحوّلة لمعيار شهري)`
                : `${activeTemplates.length} active template(s), amortized to a month`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={runNow}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
          >
            <Play size={14} />
            {isRTL ? "ترحيل المستحقات الآن" : "Run due now"}
          </button>
          <button
            onClick={() => setForm(emptyForm())}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white cursor-pointer"
          >
            <Plus size={14} />
            {isRTL ? "قالب جديد" : "New template"}
          </button>
        </div>
      </div>

      {unavailable && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {isRTL ? "جداول القوالب غير مطبَّقة بعد (ترحيل 0005، المرحلة 9)." : "Template tables not applied yet (migration 0005, Phase 9)."}
        </div>
      )}

      {loading ? (
        <p className="text-xs font-bold text-slate-400 animate-pulse">{isRTL ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Template list */}
          <div className="lg:col-span-3 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
              {isRTL ? "قوالب المصروفات المتكررة" : "Recurring expense templates"}
            </div>
            {templates.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">{isRTL ? "لا توجد قوالب بعد" : "No templates yet"}</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {isRTL ? tpl.titleAr : tpl.titleEn}
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {isRTL ? FREQ_LABEL[tpl.frequency]?.ar : FREQ_LABEL[tpl.frequency]?.en}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tpl.postingMode === "AUTO"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              : tpl.postingMode === "CONFIRM"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {isRTL ? MODE_LABEL[tpl.postingMode]?.ar : MODE_LABEL[tpl.postingMode]?.en}
                        </span>
                        {!tpl.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
                            {isRTL ? "مؤرشف" : "Archived"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {catName(tpl.categoryId)}
                        {tpl.payee ? ` · ${tpl.payee}` : ""}
                        {tpl.contractRef ? ` · #${tpl.contractRef}` : ""}
                      </p>
                      {tpl.nextDueAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5 inline-flex items-center gap-1">
                          <CalendarClock size={11} />
                          {new Date(tpl.nextDueAt).toLocaleDateString(isRTL ? "ar-EG" : "en-GB")}
                          {tpl.lastPostedPeriod ? ` · ${isRTL ? "آخر ترحيل" : "last"} ${tpl.lastPostedPeriod}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {EGP(tpl.amount)} <span className="text-[10px] text-slate-400">EGP</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(tpl)}
                          disabled={busy}
                          title={tpl.isActive ? (isRTL ? "إيقاف" : "Deactivate") : isRTL ? "تفعيل" : "Activate"}
                          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${tpl.isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                        >
                          <span
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: tpl.isActive ? "1.125rem" : "0.125rem" }}
                          />
                        </button>
                        <button
                          onClick={() =>
                            setForm({
                              id: tpl.id,
                              titleEn: tpl.titleEn,
                              titleAr: tpl.titleAr,
                              amount: String(tpl.amount),
                              categoryId: tpl.categoryId || "",
                              frequency: tpl.frequency,
                              dueDayOfMonth: tpl.dueDayOfMonth ? String(tpl.dueDayOfMonth) : "",
                              payee: tpl.payee || "",
                              contractRef: tpl.contractRef || "",
                              paymentMethod: tpl.paymentMethod,
                              postingMode: tpl.postingMode,
                            })
                          }
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#1A4B8C] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => archive(tpl.id)}
                          disabled={busy}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed-cost breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingDown size={13} />
              {isRTL ? "الجدول الشهري المعياري" : "Amortized monthly schedule"}
            </div>
            {!fixedCosts || fixedCosts.rows.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">{isRTL ? "لا توجد تكاليف ثابتة نشطة" : "No active fixed costs"}</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {fixedCosts.rows.map((row) => (
                  <div key={row.templateId} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {isRTL ? row.titleAr : row.titleEn}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {isRTL ? FREQ_LABEL[row.frequency]?.ar : FREQ_LABEL[row.frequency]?.en}
                        {amend[row.frequency] ? ` · ${EGP(row.amount)} ${amend[row.frequency]}` : ""}
                        {row.variabilityPct > 0 ? ` · ±${row.variabilityPct}%` : ""}
                      </p>
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">{EGP(row.monthly)}</p>
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{isRTL ? "الإجمالي الشهري" : "Monthly total"}</span>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{EGP(monthlyTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Repeat size={16} className="text-[#1A4B8C] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {form.id ? (isRTL ? "تعديل القالب" : "Edit template") : isRTL ? "قالب مصروف متكرر" : "New recurring expense"}
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "الاسم (EN)" : "Title (EN)"}</label>
                  <input className="doctech-input !h-10 text-sm" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "الاسم (AR)" : "Title (AR)"}</label>
                  <input className="doctech-input !h-10 text-sm" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</label>
                  <input type="number" min={0} step="0.01" className="doctech-input !h-10 text-sm font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "التكرار" : "Frequency"}</label>
                  <select className="doctech-input !h-10 text-sm" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as FormState["frequency"] })}>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{isRTL ? FREQ_LABEL[f].ar : FREQ_LABEL[f].en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "يوم الاستحقاق" : "Due day"}</label>
                  <input type="number" min={1} max={31} className="doctech-input !h-10 text-sm font-mono" value={form.dueDayOfMonth} onChange={(e) => setForm({ ...form, dueDayOfMonth: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "التصنيف" : "Category"}</label>
                  <select className="doctech-input !h-10 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">{isRTL ? "بدون تصنيف" : "Uncategorized"}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{isRTL ? c.nameAr : c.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "أسلوب الترحيل" : "Posting mode"}</label>
                  <select className="doctech-input !h-10 text-sm" value={form.postingMode} onChange={(e) => setForm({ ...form, postingMode: e.target.value as FormState["postingMode"] })}>
                    {POSTING_MODES.map((m) => (
                      <option key={m} value={m}>{isRTL ? MODE_LABEL[m].ar : MODE_LABEL[m].en}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "المستفيد" : "Payee"}</label>
                  <input className="doctech-input !h-10 text-sm" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "مرجع العقد" : "Contract ref"}</label>
                  <input className="doctech-input !h-10 text-sm" value={form.contractRef} onChange={(e) => setForm({ ...form, contractRef: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setForm(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white cursor-pointer disabled:opacity-50"
              >
                {isRTL ? "حفظ القالب" : "Save template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

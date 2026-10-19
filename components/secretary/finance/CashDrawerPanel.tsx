"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Lock,
  Unlock,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface CashSessionDto {
  id: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number | null;
  actualCash: number | null;
  variance: number | null;
  notes: string | null;
}

interface CashPayload {
  success: boolean;
  open: CashSessionDto | null;
  history?: CashSessionDto[];
  unavailable?: boolean;
  varianceAlert?: boolean;
}

const EGP = (n: number): string => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/**
 * Cash drawer (plan §5.7) — the physical reconciliation the secretary does at
 * the start and end of the day. `expectedCash` is opening float + IN − OUT;
 * the close step records what is actually counted and surfaces the variance.
 */
export function CashDrawerPanel({ isRTL }: { isRTL: boolean }) {
  const [open, setOpen] = useState<CashSessionDto | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [openingFloat, setOpeningFloat] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDirection, setMovementDirection] = useState<"IN" | "OUT">("OUT");
  const [movementCategory, setMovementCategory] = useState("PETTY_CASH");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/cash");
      const data: CashPayload = await res.json().catch(() => ({ success: false, open: null }));
      if (data.unavailable) {
        setUnavailable(true);
        setOpen(null);
      } else if (data.success) {
        setUnavailable(false);
        setOpen(data.open);
      }
    } catch (err) {
      console.error("load cash drawer:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await load();
      if (cancelled) return;
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const post = async (body: Record<string, unknown>, okMessage: string) => {
    try {
      setBusy(true);
      const res = await fetch("/api/finance/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        toast.error(data.error || (isRTL ? "فشلت العملية" : "Action failed"));
        return;
      }
      if (data.varianceAlert) {
        toast.warning(
          isRTL
            ? "فرق نقدية أكبر من ١٠٠٠ ج.م — سجّل سبب الفرق في الملاحظات"
            : "Cash variance over 1,000 EGP — record an explanation in notes"
        );
      } else {
        toast.success(okMessage);
      }
      await load();
    } catch (err) {
      console.error("cash action:", err);
      toast.error(isRTL ? "فشلت العملية" : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const expected = open?.expectedCash ?? 0;

  return (
    <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isRTL ? "درج النقدية (الخزينة)" : "Cash Drawer"}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRTL ? "افتح الدرج في بداية اليوم وأغلقه بالجرد الفعلي" : "Open at the start of the day, close with the physical count"}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isRTL ? "تحديث" : "Refresh"}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {unavailable ? (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          {isRTL
            ? "جدول جلسات الخزينة غير مطبَّق بعد (ترحيل 0005، المرحلة 9)."
            : "Cash sessions table not applied yet (migration 0005, Phase 9)."}
        </div>
      ) : loading ? (
        <p className="text-xs font-bold text-slate-400 animate-pulse">{isRTL ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : !open ? (
        /* ---- Closed: offer to open ---- */
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "رصيد بداية اليوم (ج.م)" : "Opening float (EGP)"}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              placeholder="0.00"
              className="doctech-input !h-10 text-sm font-mono"
            />
          </div>
          <button
            onClick={() => post({ action: "OPEN", openingFloat: parseFloat(openingFloat) || 0 }, isRTL ? "تم فتح الدرج" : "Drawer opened")}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
          >
            <Unlock size={15} />
            {isRTL ? "فتح الدرج" : "Open drawer"}
          </button>
        </div>
      ) : (
        /* ---- Open: show expected, allow movement + close ---- */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { labelEn: "Opening", labelAr: "بداية", value: open.openingFloat, cls: "text-slate-900 dark:text-white" },
              { labelEn: "Cash in", labelAr: "داخل", value: open.cashIn, cls: "text-emerald-600 dark:text-emerald-400" },
              { labelEn: "Cash out", labelAr: "خارج", value: open.cashOut, cls: "text-rose-600 dark:text-rose-400" },
              { labelEn: "Expected", labelAr: "المتوقع بالدرج", value: expected, cls: "text-[#1A4B8C] dark:text-blue-400" },
            ].map((cell) => (
              <div key={cell.labelEn} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? cell.labelAr : cell.labelEn}</p>
                <p className={`mt-1 font-mono font-extrabold text-sm ${cell.cls}`}>{EGP(cell.value)}</p>
              </div>
            ))}
          </div>

          {/* Manual movement */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-2.5 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "الاتجاه" : "Direction"}</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMovementDirection("IN")}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                    movementDirection === "IN" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  <ArrowDownCircle size={13} className="inline me-1" />
                  {isRTL ? "إيداع" : "In"}
                </button>
                <button
                  type="button"
                  onClick={() => setMovementDirection("OUT")}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                    movementDirection === "OUT" ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400" : "border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  <ArrowUpCircle size={13} className="inline me-1" />
                  {isRTL ? "سحب" : "Out"}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "البيان" : "Category"}</label>
              <select
                value={movementCategory}
                onChange={(e) => setMovementCategory(e.target.value)}
                className="doctech-input !h-10 text-xs"
              >
                <option value="PETTY_CASH">{isRTL ? "نثريات" : "Petty cash"}</option>
                <option value="BANK_DEPOSIT">{isRTL ? "إيداع بنكي" : "Bank deposit"}</option>
                <option value="SUPPLIES">{isRTL ? "مستلزمات" : "Supplies"}</option>
                <option value="OTHER">{isRTL ? "أخرى" : "Other"}</option>
              </select>
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                className="doctech-input !h-10 text-sm font-mono"
              />
            </div>
            <button
              onClick={() => {
                const amount = parseFloat(movementAmount);
                if (!amount || amount <= 0) return;
                post(
                  { action: "MOVEMENT", direction: movementDirection, amount, category: movementCategory },
                  isRTL ? "تم تسجيل الحركة" : "Movement recorded"
                ).then(() => setMovementAmount(""));
              }}
              disabled={busy}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white cursor-pointer disabled:opacity-50"
            >
              {isRTL ? "تسجيل" : "Record"}
            </button>
          </div>

          {/* Close with physical count */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? `النقد المعدود فعلياً (المتوقع ${EGP(expected)})` : `Physical count (expected ${EGP(expected)})`}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder={String(expected)}
                className="doctech-input !h-10 text-sm font-mono"
              />
            </div>
            <button
              onClick={() =>
                post(
                  { action: "CLOSE", actualCash: parseFloat(actualCash) || 0 },
                  isRTL ? "تم إغلاق الدرج والجرد" : "Drawer closed"
                ).then(() => setActualCash(""))
              }
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white cursor-pointer disabled:opacity-50"
            >
              <Lock size={15} />
              {isRTL ? "إغلاق وجرد" : "Close & reconcile"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Check, DollarSign, AlertTriangle } from "lucide-react";

export interface PaymentAccount {
  id: string;
  patientName: string;
  patientNameAr: string;
  doctorName: string;
  type: string;
  typeAr: string;
  totalDue: number;
  amountPaid: number;
  remaining: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER";
  date: string;
  time: string;
}

interface PaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: PaymentAccount | null;
  onCollect: (id: string, amount: number, method: PaymentAccount["method"]) => void;
  isRTL: boolean;
}

export function PaymentCollectionModal({
  isOpen,
  onClose,
  account,
  onCollect,
  isRTL,
}: PaymentCollectionModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentAccount["method"]>("CASH");

  if (!isOpen || !account) return null;

  const remaining = account.remaining;
  const parsed = parseFloat(amount) || 0;
  const valid = parsed > 0 && parsed <= remaining;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCollect(account.id, parsed, method);
    onClose();
    setAmount("");
    setMethod("CASH");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "تحصيل قيمة الكشف" : "Collect Payment"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? account.patientNameAr : account.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? "إجمالي قيمة الكشف" : "Total Due"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {account.totalDue.toLocaleString()} EGP
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {isRTL ? "المدفوع سابقاً" : "Already Paid"}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {account.amountPaid.toLocaleString()} EGP
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
              <span className="text-amber-700 dark:text-amber-400">
                {isRTL ? "المتبقي على المريض" : "Remaining Balance"}
              </span>
              <span className="font-mono font-black text-amber-700 dark:text-amber-400">
                {remaining.toLocaleString()} EGP
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "المبلغ المطلوب تحصيله الآن (ج.م) *" : "Amount to Collect Now (EGP) *"}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="doctech-input font-mono font-bold text-base !h-11"
              />
              <span className="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 end-3">
                {isRTL ? "ج.م" : "EGP"}
              </span>
            </div>
            {!valid && amount !== "" && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {isRTL
                  ? `المبلغ يجب أن يكون أكبر من 0 ولا يتجاوز المتبقي (${remaining} ج.م)`
                  : `Amount must be > 0 and at most the remaining (${remaining} EGP)`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? "طريقة الدفع *" : "Payment Method *"}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "CASH", en: "Cash", ar: "نقدي" },
                { id: "CARD", en: "Card / POS", ar: "فيزا" },
                { id: "BANK_TRANSFER", en: "Transfer", ar: "تحويل" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id as PaymentAccount["method"])}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    method === m.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {isRTL ? m.ar : m.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={15} />
              <span>{isRTL ? "تحصيل المبلغ" : "Collect Payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
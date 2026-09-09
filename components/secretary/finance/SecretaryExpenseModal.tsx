"use client";

import { useState } from "react";
import { X, Zap, Sparkles, Wrench, Receipt, Check, Banknote, CreditCard, Landmark } from "lucide-react";

export interface SecretaryExpenseItem {
  id: string;
  category: "UTILITIES" | "CLEANING" | "MAINTENANCE" | "MISC";
  categoryNameEn: string;
  categoryNameAr: string;
  titleEn: string;
  titleAr: string;
  amount: number;
  time: string;
  date: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER";
  paidTo?: string;
  receiptNo?: string;
  notes?: string;
}

interface SecretaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<SecretaryExpenseItem, "id" | "time">) => void;
  isRTL: boolean;
}

export const SECRETARY_EXPENSE_CATEGORIES = [
  { id: "UTILITIES", labelEn: "Electricity & Utilities", labelAr: "الكهرباء والمرافق", icon: Zap, color: "#F59E0B" },
  { id: "CLEANING", labelEn: "Cleaning & Sanitizers", labelAr: "نظافة ومطهرات", icon: Sparkles, color: "#06B6D4" },
  { id: "MAINTENANCE", labelEn: "Emergency Maintenance", labelAr: "صيانة طارئة وسباكة", icon: Wrench, color: "#3B82F6" },
  { id: "MISC", labelEn: "Petty Cash & Misc", labelAr: "نثريات وعهدة نقدية", icon: Receipt, color: "#64748B" },
] as const;

export function SecretaryExpenseModal({ isOpen, onClose, onSave, isRTL }: SecretaryExpenseModalProps) {
  const [category, setCategory] = useState<SecretaryExpenseItem["category"]>("UTILITIES");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<SecretaryExpenseItem["paymentMethod"]>("CASH");
  const [paidTo, setPaidTo] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !title.trim()) return;

    const catInfo = SECRETARY_EXPENSE_CATEGORIES.find((c) => c.id === category) || SECRETARY_EXPENSE_CATEGORIES[0];

    onSave({
      category,
      categoryNameEn: catInfo.labelEn,
      categoryNameAr: catInfo.labelAr,
      titleEn: title.trim(),
      titleAr: title.trim(),
      amount: parseFloat(amount),
      date,
      paymentMethod,
      paidTo: paidTo.trim() || undefined,
      receiptNo: receiptNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "صرف مصروف من الخزينة / العهدة" : "Record Front-Desk Expense / Petty Cash"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? "شحن كارت الكهرباء، نظافة، أو صيانة طارئة" : "Electricity cards, cleaning, or urgent maintenance"}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isRTL ? "تصنيف المصروف *" : "Expense Category *"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECRETARY_EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-rose-600 dark:border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 shadow-xs ring-1 ring-rose-500"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon size={16} style={{ color: cat.color }} className="mb-1" />
                    <span className="text-[10px] font-bold leading-tight">
                      {isRTL ? cat.labelAr : cat.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "المبلغ المنصرف (ج.م) *" : "Amount (EGP) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
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
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "التاريخ *" : "Date *"}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="doctech-input !h-11 text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "بيان وبند المصروف *" : "Expense Description *"}
            </label>
            <input
              type="text"
              required
              placeholder={
                category === "UTILITIES"
                  ? isRTL ? "مثال: شحن كارت كهرباء العيادة والتكييف" : "e.g. Electricity recharge card for clinic AC"
                  : category === "CLEANING"
                  ? isRTL ? "مثال: شراء مطهرات ديتول ومناديل تعقيم" : "e.g. Disinfectants & sanitizing tissues"
                  : isRTL ? "اكتب بيان المصروف..." : "Enter expense details..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="doctech-input !h-11 text-xs"
            />
          </div>

          {/* Payment Method & Paid To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "مصدر الدفع *" : "Disbursement Source *"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "CASH", en: "Cash Drawer", ar: "من الخزينة", icon: Banknote },
                  { id: "CARD", en: "POS / Card", ar: "فيزا", icon: CreditCard },
                  { id: "BANK_TRANSFER", en: "Transfer", ar: "تحويل", icon: Landmark },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as SecretaryExpenseItem["paymentMethod"])}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon size={14} className="mb-0.5" />
                      <span>{isRTL ? pm.ar : pm.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "الجهة / المدفوع له" : "Paid To / Vendor"}
              </label>
              <input
                type="text"
                placeholder={isRTL ? "مثال: شركة الكهرباء / الصيدلية / السوبرماركت" : "e.g. Electricity Co. / Pharmacy"}
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="doctech-input !h-11 text-xs"
              />
            </div>
          </div>

          {/* Receipt / Invoice number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "رقم الفاتورة / الإيصال / ملاحظات" : "Invoice / Receipt Ref / Remarks"}
            </label>
            <input
              type="text"
              placeholder={isRTL ? "مثال: إيصال رقم #88392 - تم السداد نقداً من الدرج" : "e.g. Receipt #88392"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="doctech-input !h-11 text-xs"
            />
          </div>

          {/* Submit Buttons */}
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>{isRTL ? "تسجيل وصرف المصروف" : "Record Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

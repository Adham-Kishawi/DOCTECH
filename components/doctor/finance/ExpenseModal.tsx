"use client";

import { useState } from "react";
import { X, DollarSign, Users, Zap, Building2, Stethoscope, Wrench, Megaphone, Scale, Coffee, Calendar, CreditCard, Banknote, Landmark, Check, Truck } from "lucide-react";
import type { ExpenseItem } from "@/app/api/doctor/finance/route";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, "id">) => void;
  isRTL: boolean;
  initialData?: ExpenseItem | null;
}

export const EXPENSE_CATEGORIES = [
  { id: "SALARIES", labelEn: "Salaries & Staff", labelAr: "المرتبات والأجور", icon: Users, color: "#3B82F6", bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
  { id: "UTILITIES", labelEn: "Electricity & Utilities", labelAr: "الكهرباء والمرافق", icon: Zap, color: "#F59E0B", bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
  { id: "RENT", labelEn: "Clinic Rent", labelAr: "إيجار العيادة والمقر", icon: Building2, color: "#8B5CF6", bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
  { id: "SUPPLIES", labelEn: "Medical Supplies", labelAr: "المستلزمات الطبية", icon: Stethoscope, color: "#EC4899", bg: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400" },
  { id: "LAB", labelEn: "Lab Tests & Sample Courier", labelAr: "التحاليل ونقل العينات", icon: Truck, color: "#8B5CF6", bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
  { id: "MAINTENANCE", labelEn: "Maintenance & Tech", labelAr: "الصيانة والبرمجيات", icon: Wrench, color: "#06B6D4", bg: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400" },
  { id: "MARKETING", labelEn: "Marketing & Ads", labelAr: "التسويق والإعلانات", icon: Megaphone, color: "#10B981", bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
  { id: "TAXES", labelEn: "Taxes & Gov Fees", labelAr: "الضرائب والرسوم", icon: Scale, color: "#64748B", bg: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  { id: "MISC", labelEn: "Hospitality & Misc", labelAr: "نثريات وضيافة", icon: Coffee, color: "#F97316", bg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" },
] as const;

export function ExpenseModal({ isOpen, onClose, onSave, isRTL, initialData }: ExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseItem["category"]>(initialData?.category || "UTILITIES");
  const [title, setTitle] = useState(isRTL ? initialData?.titleAr || "" : initialData?.titleEn || "");
  const [amount, setAmount] = useState<string>(initialData ? initialData.amount.toString() : "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<ExpenseItem["paymentMethod"]>(initialData?.paymentMethod || "CASH");
  const [paidTo, setPaidTo] = useState(initialData?.paidTo || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const selectedCat = EXPENSE_CATEGORIES.find((c) => c.id === category) || EXPENSE_CATEGORIES[0];

    onSave({
      category,
      categoryNameEn: selectedCat.labelEn,
      categoryNameAr: selectedCat.labelAr,
      titleEn: isRTL ? title : title,
      titleAr: isRTL ? title : title,
      amount: parseFloat(amount),
      date,
      paymentMethod,
      paidTo: paidTo.trim() || undefined,
      notes: notes.trim() || undefined,
      isRecurring,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData
                  ? isRTL ? "تعديل المصروف" : "Edit Expense"
                  : isRTL ? "تسجيل مصروف جديد للعيادة" : "Record Clinic Expense"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? "مرتبات، فواتير كهرباء، إيجار، مستلزمات طبية..." : "Staff payroll, utilities, rent, medical supplies..."}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isRTL ? "تصنيف المصروف *" : "Expense Category *"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#1A4B8C] dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Icon size={18} style={{ color: cat.color }} className="mb-1" />
                    <span className="text-[10px] font-bold leading-tight">
                      {isRTL ? cat.labelAr : cat.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "المبلغ (ج.م) *" : "Amount (EGP) *"}
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
                {isRTL ? "تاريخ السداد *" : "Payment Date *"}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="doctech-input !h-11 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "بيان المصروف / الوصف *" : "Expense Description *"}
            </label>
            <input
              type="text"
              required
              placeholder={
                category === "SALARIES"
                  ? isRTL ? "مثال: راتب السكرتيرة والتمريض لشهر سبتمبر" : "e.g. Clinic Reception & Nurse Salary"
                  : category === "UTILITIES"
                  ? isRTL ? "مثال: فاتورة كهرباء التكييفات لشهر سبتمبر" : "e.g. Clinic Electricity Bill"
                  : category === "RENT"
                  ? isRTL ? "مثال: إيجار مقر العيادة (برج النور وحدة 402)" : "e.g. Monthly Clinic Lease"
                  : category === "SUPPLIES"
                  ? isRTL ? "مثال: شراء كراتين قفازات وسرنجات ومطهرات" : "e.g. Surgical gloves, syringes & antiseptics"
                  : category === "LAB"
                  ? isRTL ? "مثال: رسوم معمل التحاليل ومندوب نقل عينات" : "e.g. Lab analysis fees & specimen courier"
                  : isRTL ? "اكتب تفاصيل وبند المصروف..." : "Enter expense details..."
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
                {isRTL ? "طريقة الدفع *" : "Payment Method *"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "CASH", en: "Cash", ar: "نقدي", icon: Banknote },
                  { id: "CARD", en: "Card", ar: "فيزا", icon: CreditCard },
                  { id: "BANK_TRANSFER", en: "Transfer", ar: "تحويل", icon: Landmark },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as ExpenseItem["paymentMethod"])}
                      className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "المستلم / الجهة المدفوع لها" : "Paid To / Vendor"}
              </label>
              <input
                type="text"
                placeholder={isRTL ? "مثال: شركة الكهرباء / شركة المستلزمات" : "e.g. Electricity Co. / Landlord"}
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="doctech-input !h-11 text-xs"
              />
            </div>
          </div>

          {/* Recurring Expense Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRTL ? "مصروف شهري متكرر (دوري)" : "Recurring Monthly Expense"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isRTL ? "مثل المرتبات، الإيجار، والإنترنت ليتم إدراجه تلقائياً كل شهر" : "Auto-flag as fixed overhead like salaries, rent, and telecom"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 accent-[#1A4B8C] rounded cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "ملاحظات إضافية / رقم الإيصال" : "Additional Notes / Receipt #"}
            </label>
            <textarea
              rows={2}
              placeholder={isRTL ? "رقم الفاتورة، تفاصيل الدفعة، أو رقم الشيك..." : "Invoice reference, check number, or receipt remarks..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#1A4B8C] resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>{initialData ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "تسجيل المصروف" : "Save Expense")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, DollarSign, Check, Banknote, CreditCard, Landmark, ShieldCheck } from "lucide-react";
import type { RevenueItem } from "@/app/api/doctor/finance/route";

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (revenue: Omit<RevenueItem, "id">) => void;
  isRTL: boolean;
}

export function RevenueModal({ isOpen, onClose, onSave, isRTL }: RevenueModalProps) {
  const [type, setType] = useState<RevenueItem["type"]>("CONSULTATION");
  const [patientName, setPatientName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<RevenueItem["paymentMethod"]>("CASH");
  const [status, setStatus] = useState<RevenueItem["status"]>("PAID");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !patientName.trim()) return;

    const typeNames = {
      CONSULTATION: { en: "New Consultation", ar: "كشف جديد" },
      FOLLOW_UP: { en: "Follow-up Check", ar: "إعادة واستشارة" },
      PROCEDURE: { en: "Minor Procedure / Wound Care", ar: "إجراء جراحي / غيار" },
      REPORT: { en: "Medical Report & Attestation", ar: "تقرير طبي معتمد" },
      OTHER: { en: "Other Clinical Service", ar: "خدمة طبية أخرى" },
    };

    const selectedType = typeNames[type] || typeNames.CONSULTATION;

    onSave({
      type,
      typeNameEn: selectedType.en,
      typeNameAr: selectedType.ar,
      patientName: patientName.trim(),
      patientNameAr: patientName.trim(),
      amount: parseFloat(amount),
      date,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      paymentMethod,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "تسجيل إيراد / كشف إضافي" : "Record Extra Revenue"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRTL ? "إضافة كشف، جراحة صغرى، أو تقرير طبي" : "Add patient consultation, minor surgery, or medical review"}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "نوع الخدمة / الكشف *" : "Service / Visit Type *"}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RevenueItem["type"])}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#1A4B8C]"
            >
              <option value="CONSULTATION">{isRTL ? "كشف جديد (New Consultation)" : "New Consultation"}</option>
              <option value="FOLLOW_UP">{isRTL ? "إعادة واستشارة (Follow-up)" : "Follow-up Visit"}</option>
              <option value="PROCEDURE">{isRTL ? "إجراء جراحي / غيار (Minor Procedure)" : "Minor Procedure / Wound Care"}</option>
              <option value="REPORT">{isRTL ? "تقرير طبي معتمد (Medical Report)" : "Medical Report"}</option>
              <option value="OTHER">{isRTL ? "خدمة طبية أخرى (Other)" : "Other Service"}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "اسم المريض *" : "Patient Name *"}
            </label>
            <input
              type="text"
              required
              placeholder={isRTL ? "مثال: طارق محمود السيد" : "e.g. Tarek Mahmoud"}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="doctech-input !h-11 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? "المبلغ (ج.م) *" : "Amount (EGP) *"}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="doctech-input font-mono font-bold text-sm !h-11"
              />
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? "طريقة الدفع *" : "Payment Method *"}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "CASH", en: "Cash", ar: "نقدي", icon: Banknote },
                { id: "CARD", en: "Card", ar: "فيزا", icon: CreditCard },
                { id: "BANK_TRANSFER", en: "Transfer", ar: "تحويل", icon: Landmark },
                { id: "INSURANCE", en: "Insurance", ar: "تأمين", icon: ShieldCheck },
              ].map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as RevenueItem["paymentMethod"])}
                    className={`p-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isRTL ? pm.ar : pm.en}
                  </button>
                );
              })}
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>{isRTL ? "تسجيل الإيراد" : "Save Revenue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

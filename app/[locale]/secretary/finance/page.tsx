"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DollarSign, CreditCard, Banknote, ShieldCheck, Search, CheckCircle2, Clock, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  patientName: string;
  patientNameAr: string;
  doctorName: string;
  doctorNameAr: string;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "INSURANCE";
  status: "PAID" | "PENDING";
  time: string;
  type: string;
  typeAr: string;
}

const initialTransactions: Transaction[] = [
  { id: "TX-101", patientName: "Ahmed Hassan", patientNameAr: "أحمد حسن", doctorName: "Dr. Ahmed Hossam", doctorNameAr: "د. أحمد حسام", amount: 350, method: "CASH", status: "PAID", time: "09:15 AM", type: "Follow-up", typeAr: "متابعة" },
  { id: "TX-102", patientName: "Youssef Nabil", patientNameAr: "يوسف نبيل", doctorName: "Dr. Ahmed Hossam", doctorNameAr: "د. أحمد حسام", amount: 400, method: "CARD", status: "PAID", time: "09:40 AM", type: "General Check-up", typeAr: "كشف عام" },
  { id: "TX-103", patientName: "Sara Ibrahim", patientNameAr: "سارة إبراهيم", doctorName: "Dr. Ahmed Hossam", doctorNameAr: "د. أحمد حسام", amount: 450, method: "CASH", status: "PENDING", time: "10:45 AM", type: "New Consultation", typeAr: "كشف جديد" },
  { id: "TX-104", patientName: "Mohamed Ali", patientNameAr: "محمد علي", doctorName: "Dr. Ahmed Hossam", doctorNameAr: "د. أحمد حسام", amount: 300, method: "BANK_TRANSFER", status: "PAID", time: "11:15 AM", type: "Post-Op Review", typeAr: "متابعة جراحة" },
  { id: "TX-105", patientName: "Fatima Omar", patientNameAr: "فاطمة عمر", doctorName: "Dr. Ahmed Hossam", doctorNameAr: "د. أحمد حسام", amount: 350, method: "CASH", status: "PAID", time: "01:10 PM", type: "Follow-up", typeAr: "متابعة" },
];

export default function SecretaryFinancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const totalCollected = transactions.filter((t) => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions.filter((t) => t.status === "PENDING").reduce((sum, t) => sum + t.amount, 0);
  const cashTotal = transactions.filter((t) => t.status === "PAID" && t.method === "CASH").reduce((sum, t) => sum + t.amount, 0);
  const digitalTotal = totalCollected - cashTotal;

  const handleMarkAsPaid = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "PAID" } : t))
    );
    toast.success(isRTL ? "✅ تم تسجيل تحصيل المبلغ وإصدار الإيصال" : "✅ Payment recorded & receipt generated!");
  };

  const filtered = transactions.filter((t) => {
    const matchesMethod = filterMethod === "all" || t.method === filterMethod || (filterMethod === "PENDING" && t.status === "PENDING");
    const matchesSearch = t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.patientNameAr.includes(searchTerm) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-1.5">
            <DollarSign size={13} />
            {isRTL ? "الخزينة والمدفوعات اليومية" : "Reception Cashier & Billing"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "إدارة الخزينة والإيرادات" : "Financial Operations & Invoicing"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "تسجيل المتحصلات النقدية، متابعة مدفوعات الفيزا والمحافظ، وفصل المستحقات"
              : "Track cash intake, POS/card payments, wallet transfers, and pending dues"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-3.5 py-2 rounded-xl">
            {isRTL ? `المتحصل اليوم: ${totalCollected} ج.م` : `Today Collected: ${totalCollected} EGP`}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "إجمالي المحصل" : "Total Collected"}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {totalCollected} <span className="text-xs">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "نقدي (خزينة)" : "Cash Drawer"}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                {cashTotal} <span className="text-xs">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Banknote size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "إلكتروني (فيزا/محافظ)" : "Card / Digital"}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                {digitalTotal} <span className="text-xs">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "مستحقات معلقة" : "Pending Dues"}</span>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {totalPending} <span className="text-xs">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث باسم المريض أو رقم الحركة..." : "Search patient or TX ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", en: "All", ar: "الكل" },
            { id: "PENDING", en: "Pending (غير محصل)", ar: "معلق للدفع" },
            { id: "CASH", en: "Cash (نقدي)", ar: "نقدي" },
            { id: "CARD", en: "Card (فيزا)", ar: "فيزا" },
            { id: "BANK_TRANSFER", en: "Transfer (تحويل)", ar: "تحويل إلكتروني" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterMethod(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMethod === st.id
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? st.ar : st.en}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl font-extrabold flex items-center justify-center shrink-0 ${
                  tx.method === "CASH"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                    : tx.method === "CARD"
                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-600"
                    : "bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                }`}
              >
                {tx.method === "CASH" ? <Banknote size={20} /> : <CreditCard size={20} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {isRTL ? tx.patientNameAr : tx.patientName}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">({tx.id})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tx.method}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {isRTL ? tx.typeAr : tx.type} • {isRTL ? tx.doctorNameAr : tx.doctorName} • {tx.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white">
                {tx.amount} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
              </span>

              {tx.status === "PENDING" ? (
                <button
                  onClick={() => handleMarkAsPaid(tx.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>{isRTL ? "تحصيل الآن" : "Collect"}</span>
                </button>
              ) : (
                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  {isRTL ? "تم التحصيل ✓" : "PAID ✓"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

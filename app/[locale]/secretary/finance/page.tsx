"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  DollarSign,
  Search,
  Receipt,
  Zap,
  Users,
  BadgeCheck,
  AlertCircle,
  HandCoins,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  SecretaryExpenseModal,
  SecretaryExpenseItem,
  SECRETARY_EXPENSE_CATEGORIES,
} from "@/components/secretary/finance/SecretaryExpenseModal";
import {
  PaymentCollectionModal,
  PaymentAccount,
} from "@/components/secretary/finance/PaymentCollectionModal";

interface PaymentRecord {
  id: string;
  patientName: string;
  patientNameAr: string;
  doctorName: string;
  type: string;
  typeAr: string;
  date: string;
  time: string;
  totalDue: number;
  amountPaid: number;
  hasBooking: boolean;
}

interface OutflowTransaction {
  id: string;
  kind: "OUTFLOW";
  category: SecretaryExpenseItem["category"];
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

const initialPayments: PaymentRecord[] = [
  { id: "APT-101", patientName: "Ahmed Hassan", patientNameAr: "أحمد حسن", doctorName: "Dr. Ahmed Hossam", type: "New Consultation", typeAr: "كشف جديد", date: "Today", time: "09:15 AM", totalDue: 500, amountPaid: 500, hasBooking: true },
  { id: "APT-102", patientName: "Youssef Nabil", patientNameAr: "يوسف نبيل", doctorName: "Dr. Ahmed Hossam", type: "General Check-up", typeAr: "كشف عام", date: "Today", time: "09:40 AM", totalDue: 400, amountPaid: 400, hasBooking: true },
  { id: "APT-103", patientName: "Sara Ibrahim", patientNameAr: "سارة إبراهيم", doctorName: "Dr. Ahmed Hossam", type: "Follow-up", typeAr: "إعادة واستشارة", date: "Today", time: "10:45 AM", totalDue: 450, amountPaid: 250, hasBooking: true },
  { id: "APT-104", patientName: "Mohamed Ali", patientNameAr: "محمد علي", doctorName: "Dr. Ahmed Hossam", type: "Minor Procedure", typeAr: "إجراء جراحي وغيار", date: "Today", time: "11:15 AM", totalDue: 850, amountPaid: 850, hasBooking: true },
  { id: "APT-105", patientName: "Fatima Omar", patientNameAr: "فاطمة عمر", doctorName: "Dr. Ahmed Hossam", type: "New Consultation", typeAr: "كشف جديد", date: "Today", time: "01:10 PM", totalDue: 500, amountPaid: 500, hasBooking: true },
  { id: "APT-106", patientName: "Kareem Tarek", patientNameAr: "كريم طارق", doctorName: "Dr. Ahmed Hossam", type: "New Consultation", typeAr: "كشف جديد", date: "Today", time: "02:00 PM", totalDue: 500, amountPaid: 0, hasBooking: true },
];

const initialOutflows: OutflowTransaction[] = [
  {
    id: "EXP-SEC-01",
    kind: "OUTFLOW",
    category: "UTILITIES",
    categoryNameEn: "Electricity & Utilities",
    categoryNameAr: "الكهرباء والمرافق",
    titleEn: "Clinic Electricity Smart Card Recharge",
    titleAr: "شحن كارت عداد الكهرباء الذكي",
    amount: 400,
    time: "08:30 AM",
    date: "Today",
    paymentMethod: "CASH",
    paidTo: "South Cairo Electricity Store",
    receiptNo: "ELEC-9921",
  },
  {
    id: "EXP-SEC-02",
    kind: "OUTFLOW",
    category: "UTILITIES",
    categoryNameEn: "Electricity & Utilities",
    categoryNameAr: "الكهرباء والمرافق",
    titleEn: "Water Utility Bill",
    titleAr: "فواتير المياه",
    amount: 120,
    time: "09:00 AM",
    date: "Today",
    paymentMethod: "CASH",
    paidTo: "Cairo Water Authority",
    receiptNo: "WTR-3321",
  },
];

type FinancialOperation = { kind: "INFLOW" } & PaymentRecord | OutflowTransaction;

const isFullyPaid = (op: FinancialOperation): boolean =>
  op.kind === "INFLOW" && op.amountPaid >= op.totalDue;

export default function SecretaryFinancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [outflows, setOutflows] = useState<OutflowTransaction[]>(initialOutflows);

  const [filterType, setFilterType] = useState<"ALL" | "PATIENTS" | "OUTFLOW" | "OUTSTANDING" | "FULLY_PAID" | "UNPAID">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [collectAccount, setCollectAccount] = useState<PaymentAccount | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  // ---- Secretary metrics (correct clinic logic — NO profit reveals) ----
  const totalCollected = useMemo(() => payments.reduce((s, p) => s + p.amountPaid, 0), [payments]);
  const totalBookedPatients = useMemo(() => payments.filter((p) => p.hasBooking).length, [payments]);
  const fullyPaidCount = useMemo(
    () => payments.filter((p) => p.amountPaid >= p.totalDue).length,
    [payments]
  );
  const outstandingCount = useMemo(
    () => payments.filter((p) => p.amountPaid < p.totalDue).length,
    [payments]
  );
  const totalOutstanding = useMemo(
    () => payments.reduce((s, p) => s + Math.max(0, p.totalDue - p.amountPaid), 0),
    [payments]
  );

  const totalExpenses = useMemo(() => outflows.reduce((s, e) => s + e.amount, 0), [outflows]);

  // ---- Handlers ----
  const handleCollect = (id: string, amount: number, method: PaymentAccount["method"]) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newPaid = Math.min(p.totalDue, p.amountPaid + amount);
        return { ...p, amountPaid: newPaid };
      })
    );
    const patient = payments.find((p) => p.id === id);
    toast.success(
      isRTL
        ? `✅ تم تحصيل ${amount} ج.م (${method}) من ${patient?.patientNameAr || ""}`
        : `✅ Collected ${amount} EGP (${method}) from ${patient?.patientName || ""}`
    );
  };

  const handleSaveExpense = (expenseData: Omit<SecretaryExpenseItem, "id" | "time">) => {
    const newExpense: OutflowTransaction = {
      ...expenseData,
      id: `EXP-SEC-${Date.now().toString().slice(-4)}`,
      kind: "OUTFLOW",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setOutflows((prev) => [newExpense, ...prev]);
    toast.success(
      isRTL
        ? `✅ تم تسجيل مصروف ${expenseData.amount} ج.م`
        : `✅ Recorded ${expenseData.amount} EGP expense`
    );
  };

  const handleDeleteOutflow = (id: string) => {
    setOutflows((prev) => prev.filter((e) => e.id !== id));
    toast.info(isRTL ? "🗑️ تم حذف المصروف" : "🗑️ Expense deleted");
  };

  // ---- Combined & filtered ----
  const allOperations = useMemo<FinancialOperation[]>(() => {
    return [
      ...payments.map((p) => ({ kind: "INFLOW" as const, ...p })),
      ...outflows,
    ];
  }, [payments, outflows]);

  const filteredOperations = useMemo(() => {
    return allOperations.filter((op) => {
      if (filterType === "OUTFLOW" && op.kind !== "OUTFLOW") return false;
      if (filterType === "OUTFLOW" && op.kind === "OUTFLOW") return true;
      if (filterType === "PATIENTS" && op.kind !== "INFLOW") return false;
      if (filterType === "PATIENTS" && op.kind === "INFLOW") return true;
      if (filterType === "FULLY_PAID" && (op.kind !== "INFLOW" || !isFullyPaid(op))) return false;
      if (filterType === "UNPAID" && (op.kind !== "INFLOW" || isFullyPaid(op))) return false;
      if (filterType === "OUTSTANDING" && (op.kind !== "INFLOW" || isFullyPaid(op))) return false;

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      if (op.kind === "INFLOW") {
        return (
          op.patientName.toLowerCase().includes(q) ||
          op.patientNameAr.includes(q) ||
          op.id.toLowerCase().includes(q)
        );
      }
      return (
        op.titleEn.toLowerCase().includes(q) ||
        op.titleAr.toLowerCase().includes(q) ||
        op.id.toLowerCase().includes(q) ||
        (op.paidTo && op.paidTo.toLowerCase().includes(q))
      );
    });
  }, [allOperations, filterType, searchTerm]);

  const stats = [
    {
      labelEn: "Total Collected Today",
      labelAr: "إجمالي المقبوضات اليوم",
      value: totalCollected,
      isCurrency: true,
      icon: HandCoins,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      subEn: "Cash, POS & Transfers",
      subAr: "نقدي وفيزا وتحويلات",
    },
    {
      labelEn: "Patients Today (Booked)",
      labelAr: "مرضى اليوم (حجوزات)",
      value: totalBookedPatients,
      isCurrency: false,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      subEn: `${fullyPaidCount} fully paid`,
      subAr: `${fullyPaidCount} دفعوا كامل المبلغ`,
    },
    {
      labelEn: "Fully Paid",
      labelAr: "دفعوا كامل المبلغ",
      value: fullyPaidCount,
      isCurrency: false,
      icon: BadgeCheck,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/50",
      subEn: "Out of booked patients",
      subAr: "من إجمالي المرضى",
    },
    {
      labelEn: "Outstanding Balance",
      labelAr: "متبقي على المرضى",
      value: totalOutstanding,
      isCurrency: true,
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      subEn: `${outstandingCount} patients owe`,
      subAr: `${outstandingCount} مريض عليهم متبقي`,
    },
  ];

  const countStats = [
    { labelEn: "Booked", labelAr: "حجز", value: totalBookedPatients, icon: UserCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50" },
    { labelEn: "Fully Paid", labelAr: "دفع كامل", value: fullyPaidCount, icon: BadgeCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
    { labelEn: "Owe Balance", labelAr: "باقي عليهم", value: outstandingCount, icon: UserX, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50" },
    { labelEn: "Expenses", labelAr: "مصروفات", value: outflows.length, icon: Receipt, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-2">
            <DollarSign size={14} />
            {isRTL ? "تابع الاستقبال — تحصيل المرضى والمصروفات" : "Reception Cashier — Patient Collections & Expenses"}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isRTL ? "التحصيل من المرضى والمصروفات اليومية" : "Patient Collections & Daily Expenses"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? "متابعة حجوزات المرضى، من دفع كامل المبلغ، من بقي عليه، وتسجيل مصروفات العيادة (كهرباء، مياه، غيره)"
              : "Track patient bookings, who paid in full, who still owes, and record clinic expenses (utilities, water, etc.)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Expense Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/10 transition-all cursor-pointer"
          >
            <Zap size={15} />
            <span>{isRTL ? "إضافة مصروف (كهرباء/مياه)" : "Add Expense / Bill"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ labelEn, labelAr, value, isCurrency, icon: Icon, color, bg, subEn, subAr }) => (
          <div key={labelEn} className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isRTL ? labelAr : labelEn}
                </span>
                <p className={`text-xl sm:text-2xl font-black mt-1 font-mono ${isCurrency ? color : "text-slate-900 dark:text-white"}`}>
                  {value.toLocaleString()}
                  {isCurrency && (
                    <span className="text-xs font-normal text-slate-500">{isRTL ? " ج.م" : " EGP"}</span>
                  )}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {isRTL ? subAr : subEn}
            </p>
          </div>
        ))}
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {countStats.map(({ labelEn, labelAr, value, icon: Icon, color, bg }) => (
          <div key={labelEn} className="p-4 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-[11px] font-bold text-slate-400 truncate mt-1">{isRTL ? labelAr : labelEn}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Expenses Summary */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isRTL ? "مصروفات اليوم" : "Today's Expenses"}
            </h2>
          </div>
          <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
            -{totalExpenses.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SECRETARY_EXPENSE_CATEGORIES.slice(0, 4).map((cat) => {
            const Icon = cat.icon;
            const sum = outflows.filter((e) => e.category === cat.id).reduce((s, e) => s + e.amount, 0);
            return (
              <div key={cat.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{isRTL ? cat.labelAr : cat.labelEn}</p>
                  <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    {sum.toLocaleString()} <span className="text-[10px] text-slate-400">EGP</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث باسم المريض، بيان المصروف، أو الرقم..." : "Search patient, expense or ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", en: "All", ar: "الكل" },
            { id: "PATIENTS", en: "Patients", ar: "المرضى" },
            { id: "OUTFLOW", en: "Expenses", ar: "المصروفات" },
            { id: "FULLY_PAID", en: "Fully Paid", ar: "دفع كامل" },
            { id: "UNPAID", en: "Owe Balance", ar: "باقي عليهم" },
            { id: "OUTSTANDING", en: "Outstanding (EGP)", ar: "المتبقي (ج.م)" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterType(st.id as typeof filterType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filterType === st.id
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              {isRTL ? st.ar : st.en}
            </button>
          ))}
        </div>
      </div>

      {/* Combined List */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filteredOperations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold">{isRTL ? "لا توجد سجلات مطابقة للبحث" : "No matching records"}</p>
          </div>
        ) : (
          filteredOperations.map((op) => {
            if (op.kind === "INFLOW") {
              const remaining = Math.max(0, op.totalDue - op.amountPaid);
              const full = remaining === 0;
              return (
                <div key={op.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${full ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600" : "bg-amber-50 dark:bg-amber-950/50 text-amber-600"}`}>
                      {full ? <BadgeCheck size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${full ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"}`}>
                          {full ? (isRTL ? "دفع كامل ✓" : "FULLY PAID") : (isRTL ? "باقي عليه" : "OWES BALANCE")}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {isRTL ? op.patientNameAr : op.patientName}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">({op.id})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {isRTL ? op.typeAr : op.type} • {isRTL ? op.doctorName : op.doctorName} • {op.time}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex flex-wrap gap-x-3">
                        <span>{isRTL ? "قيمة الكشف:" : "Due:"} <b className="text-slate-700 dark:text-slate-300">{op.totalDue.toLocaleString()} EGP</b></span>
                        <span className="text-emerald-600 dark:text-emerald-400">{isRTL ? "المدفوع:" : "Paid:"} {op.amountPaid.toLocaleString()}</span>
                        {!full && <span className="text-amber-600 dark:text-amber-400">{isRTL ? "المتبقي:" : "Remaining:"} {remaining.toLocaleString()}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className={`text-sm sm:text-base font-black font-mono ${full ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {op.amountPaid.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
                    </span>
                    {!full && (
                      <button
                        onClick={() => { setCollectAccount({ id: op.id, patientName: op.patientName, patientNameAr: op.patientNameAr, doctorName: op.doctorName, type: op.type, typeAr: op.typeAr, totalDue: op.totalDue, amountPaid: op.amountPaid, remaining, method: "CASH", date: op.date, time: op.time }); setIsCollectModalOpen(true); }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <HandCoins size={13} />
                        <span>{isRTL ? "تحصيل" : "Collect"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            } else {
              const catInfo = SECRETARY_EXPENSE_CATEGORIES.find((c) => c.id === op.category) || SECRETARY_EXPENSE_CATEGORIES[0];
              const Icon = catInfo.icon;
              return (
                <div key={op.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors bg-rose-50/10 dark:bg-rose-950/5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                          {isRTL ? "مصروف العيادة" : "CLINIC EXPENSE"}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">{isRTL ? op.titleAr : op.titleEn}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}>
                          {isRTL ? catInfo.labelAr : catInfo.labelEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {op.time} • {isRTL ? "الجهة: " : "To: "}{op.paidTo || (isRTL ? "نثريات" : "Petty Cash")}
                        {op.receiptNo && ` • (${op.receiptNo})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400">
                      -{op.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteOutflow(op.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={isRTL ? "حذف المصروف" : "Delete Expense"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      {/* Expense Modal */}
      <SecretaryExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        isRTL={isRTL}
      />

      {/* Payment Collection Modal */}
      <PaymentCollectionModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        account={collectAccount}
        onCollect={handleCollect}
        isRTL={isRTL}
      />
    </div>
  );
}
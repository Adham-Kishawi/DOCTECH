"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Trash2,
  Receipt,
  Sparkles,
  Users,
  Building2,
  Zap,
  Stethoscope,
  BarChart3,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { ExpenseModal, EXPENSE_CATEGORIES } from "@/components/doctor/finance/ExpenseModal";
import { RevenueModal } from "@/components/doctor/finance/RevenueModal";
import { ProfitLossStatement } from "@/components/doctor/finance/ProfitLossStatement";
import type { ExpenseItem, RevenueItem, MonthFinancialRecord } from "@/app/api/doctor/finance/route";

// Default empty month record for clean slate
function createEmptyMonthRecord(monthKey: string): MonthFinancialRecord {
  return {
    monthKey,
    monthNameEn: monthKey,
    monthNameAr: monthKey,
    grossRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalVisits: 0,
    avgPerPatient: 0,
    revenueGrowthMoM: 0,
    expensesGrowthMoM: 0,
    expenses: [],
    revenues: [],
    weeklyTrend: [
      { week: "Week 1", weekAr: "الأسبوع ١", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 2", weekAr: "الأسبوع ٢", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 3", weekAr: "الأسبوع ٣", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 4", weekAr: "الأسبوع ٤", revenue: 0, expenses: 0, netProfit: 0 },
    ],
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  SALARIES: "#3B82F6", // Blue
  RENT: "#8B5CF6", // Purple
  UTILITIES: "#F59E0B", // Amber
  SUPPLIES: "#EC4899", // Pink
  MAINTENANCE: "#06B6D4", // Cyan
  MARKETING: "#10B981", // Emerald
  TAXES: "#64748B", // Slate
  MISC: "#F97316", // Orange
};

export default function DoctorFinancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "revenues" | "pnl">("overview");

  // Multi-month database state
  const [monthsData, setMonthsData] = useState<Record<string, MonthFinancialRecord>>({});
  const [availableMonths, setAvailableMonths] = useState<{ key: string; nameEn: string; nameAr: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Expense search & filters
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("all");
  const [expenseMethodFilter, setExpenseMethodFilter] = useState<string>("all");

  // Fetch real financial records for selected month
  useEffect(() => {
    let isMounted = true;

    async function fetchMonthData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/doctor/finance?month=${encodeURIComponent(selectedMonth)}`);
        const data = await res.json();

        if (isMounted && data.success) {
          if (data.currentMonth) {
            setMonthsData((prev) => ({
              ...prev,
              [selectedMonth]: data.currentMonth,
            }));
          }
          if (Array.isArray(data.allMonths)) {
            setAvailableMonths(data.allMonths);
          }
        }
      } catch (err) {
        console.error("Failed to load doctor finance records:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMonthData();

    return () => {
      isMounted = false;
    };
  }, [selectedMonth]);

  // Current month active record
  const currentRecord = useMemo(() => {
    return monthsData[selectedMonth] || createEmptyMonthRecord(selectedMonth);
  }, [monthsData, selectedMonth]);

  // Recalculate dynamic totals for the current month
  const totalExpenses = useMemo(() => {
    return currentRecord.expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [currentRecord.expenses]);

  const grossRevenue = currentRecord.grossRevenue;
  const netProfit = grossRevenue - totalExpenses;
  const profitMargin = grossRevenue > 0 ? parseFloat(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

  // Categorized expenses aggregation
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { category: string; labelEn: string; labelAr: string; amount: number; count: number; color: string }> = {};

    EXPENSE_CATEGORIES.forEach((cat) => {
      map[cat.id] = {
        category: cat.id,
        labelEn: cat.labelEn,
        labelAr: cat.labelAr,
        amount: 0,
        count: 0,
        color: cat.color,
      };
    });

    currentRecord.expenses.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = {
          category: item.category,
          labelEn: item.categoryNameEn || item.category,
          labelAr: item.categoryNameAr || item.category,
          amount: 0,
          count: 0,
          color: CATEGORY_COLORS[item.category] || "#64748B",
        };
      }
      map[item.category].amount += item.amount;
      map[item.category].count += 1;
    });

    return Object.values(map)
      .filter((c) => c.amount > 0)
      .map((c) => ({
        ...c,
        percentage: totalExpenses > 0 ? ((c.amount / totalExpenses) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentRecord.expenses, totalExpenses]);

  // Chart data for Donut
  const donutData = useMemo(() => {
    return categoryBreakdown.map((c) => ({
      name: isRTL ? c.labelAr : c.labelEn,
      value: c.amount,
      color: c.color,
      percentage: c.percentage,
    }));
  }, [categoryBreakdown, isRTL]);

  // Handlers for adding/editing/deleting expenses
  const handleSaveExpense = async (expenseData: Omit<ExpenseItem, "id">) => {
    const tempId = editingExpense ? editingExpense.id : `EXP-${selectedMonth.split("-")[1] || "01"}-${Date.now().toString().slice(-4)}`;

    setMonthsData((prev) => {
      const target = prev[selectedMonth] || createEmptyMonthRecord(selectedMonth);
      let updatedExpenses: ExpenseItem[];

      if (editingExpense) {
        updatedExpenses = target.expenses.map((e) =>
          e.id === editingExpense.id ? { ...expenseData, id: editingExpense.id } : e
        );
      } else {
        const newExpense: ExpenseItem = {
          ...expenseData,
          id: tempId,
        };
        updatedExpenses = [newExpense, ...target.expenses];
      }

      return {
        ...prev,
        [selectedMonth]: {
          ...target,
          expenses: updatedExpenses,
        },
      };
    });

    try {
      await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseData,
          category: expenseData.category,
          amount: expenseData.amount,
          paymentMethod: expenseData.paymentMethod,
          paidTo: expenseData.paidTo,
          notes: expenseData.notes,
          recordedByRole: "doctor",
        }),
      });
    } catch (err) {
      console.error("Failed to save doctor expense in DB:", err);
    }

    toast.success(
      editingExpense
        ? (isRTL ? "✅ تم تعديل المصروف بنجاح" : "✅ Expense updated successfully!")
        : (isRTL ? "✅ تم إضافة المصروف بنجاح وتحديث الحسابات" : "✅ Expense recorded successfully!")
    );

    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    setMonthsData((prev) => {
      const target = prev[selectedMonth] || createEmptyMonthRecord(selectedMonth);
      return {
        ...prev,
        [selectedMonth]: {
          ...target,
          expenses: target.expenses.filter((e) => e.id !== id),
        },
      };
    });

    try {
      await fetch(`/api/finance/expenses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete doctor expense in DB:", err);
    }

    toast.info(isRTL ? "🗑️ تم حذف المصروف وإعادة احتساب الأرباح" : "🗑️ Expense deleted and net profit recalculated.");
  };

  const handleSaveRevenue = async (revenueData: Omit<RevenueItem, "id">) => {
    const tempId = `REV-${Date.now().toString().slice(-4)}`;
    const newRev: RevenueItem = {
      ...revenueData,
      id: tempId,
    };

    setMonthsData((prev) => {
      const target = prev[selectedMonth] || createEmptyMonthRecord(selectedMonth);
      return {
        ...prev,
        [selectedMonth]: {
          ...target,
          grossRevenue: target.grossRevenue + revenueData.amount,
          revenues: [newRev, ...target.revenues],
        },
      };
    });

    try {
      await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: revenueData.type,
          amount: revenueData.amount,
          paymentMethod: revenueData.paymentMethod,
        }),
      });
    } catch (err) {
      console.error("Failed to save doctor revenue in DB:", err);
    }

    toast.success(isRTL ? "💰 تم تسجيل الإيراد بنجاح" : "💰 Revenue logged successfully!");
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return currentRecord.expenses.filter((e) => {
      const matchesCat = expenseCategoryFilter === "all" || e.category === expenseCategoryFilter;
      const matchesMethod = expenseMethodFilter === "all" || e.paymentMethod === expenseMethodFilter;
      const searchLower = expenseSearch.toLowerCase();
      const matchesSearch =
        !expenseSearch ||
        e.titleEn.toLowerCase().includes(searchLower) ||
        e.titleAr.toLowerCase().includes(searchLower) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(searchLower)) ||
        (e.notes && e.notes.toLowerCase().includes(searchLower));

      return matchesCat && matchesMethod && matchesSearch;
    });
  }, [currentRecord.expenses, expenseCategoryFilter, expenseMethodFilter, expenseSearch]);

  // Quick categories sums
  const salariesSum = currentRecord.expenses.filter((e) => e.category === "SALARIES").reduce((s, e) => s + e.amount, 0);
  const rentSum = currentRecord.expenses.filter((e) => e.category === "RENT").reduce((s, e) => s + e.amount, 0);
  const utilitiesSum = currentRecord.expenses.filter((e) => e.category === "UTILITIES").reduce((s, e) => s + e.amount, 0);
  const suppliesSum = currentRecord.expenses.filter((e) => e.category === "SUPPLIES").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-2">
            <DollarSign size={14} />
            {isRTL ? "الإدارة المالية وحساب الأرباح والمصروفات" : "Clinical Financial Management & P&L"}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isRTL ? "أرباح ومصروفات العيادة الشهرية" : "Monthly Earnings & Clinic Expenses"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? "متابعة دقيقة لصافي الأرباح، مرتبات الفريق، فواتير الكهرباء والمرافق، الإيجار، والمستلزمات الطبية"
              : "Comprehensive tracking of net profit, staff salaries, electricity & utilities, rent, and medical supplies"}
          </p>
        </div>

        {/* Action Buttons & Month Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label={isRTL ? "اختر الشهر" : "Select Month"}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-4 pe-9 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {isRTL ? m.nameAr : m.nameEn}
                  </option>
                ))
              ) : (
                <option value={selectedMonth}>{selectedMonth}</option>
              )}
            </select>
            <Calendar size={14} className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/10 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{isRTL ? "إضافة مصروف" : "Add Expense"}</span>
          </button>

          {/* Add Revenue Button */}
          <button
            onClick={() => setIsRevenueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>{isRTL ? "إضافة إيراد" : "Add Revenue"}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Financial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? "إجمالي الإيرادات" : "Gross Revenue"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {grossRevenue.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50">+{currentRecord.revenueGrowthMoM}%</span>
            <span className="text-slate-400 font-normal">{isRTL ? "مقارنة بالشهر السابق" : "vs last month"}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-400/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? "إجمالي المصروفات" : "Total Expenses"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {totalExpenses.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono">
              {((totalExpenses / grossRevenue) * 100).toFixed(0)}%
            </span>
            <span className="text-slate-400 font-normal">{isRTL ? "من إجمالي الدخل" : "of total revenue"}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs hover:border-emerald-500 transition-all relative overflow-hidden">
          <div className="absolute top-0 end-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {isRTL ? "صافي أرباح الطبيب" : "Net Clinic Profit"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {netProfit.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-2">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 font-mono">
              {profitMargin}%
            </span>
            <span className="text-slate-400 font-normal">{isRTL ? "هامش صافي الربح" : "net profit margin"}</span>
          </div>
        </div>

        {/* Avg Fee / Consultations */}
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isRTL ? "الكشوفات والمتوسط" : "Visits & Avg Fee"}
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {currentRecord.totalVisits}{" "}
                <span className="text-xs font-normal text-slate-500">{isRTL ? "كشف" : "Visits"}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
            <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{currentRecord.avgPerPatient} EGP</span>
            <span className="text-slate-400 font-normal">{isRTL ? "متوسط الدخل/المريض" : "avg per patient"}</span>
          </div>
        </div>
      </div>

      {/* Category Quick Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Salaries */}
        <div className="p-3.5 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "المرتبات والأجور" : "Staff Salaries"}</p>
            <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {salariesSum.toLocaleString()} <span className="text-[10px] text-slate-400">EGP</span>
            </p>
          </div>
        </div>

        {/* Rent */}
        <div className="p-3.5 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "إيجار العيادة" : "Clinic Rent"}</p>
            <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {rentSum.toLocaleString()} <span className="text-[10px] text-slate-400">EGP</span>
            </p>
          </div>
        </div>

        {/* Utilities / Electricity */}
        <div className="p-3.5 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "الكهرباء والمرافق" : "Electricity & Bills"}</p>
            <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {utilitiesSum.toLocaleString()} <span className="text-[10px] text-slate-400">EGP</span>
            </p>
          </div>
        </div>

        {/* Medical Supplies */}
        <div className="p-3.5 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 flex items-center justify-center shrink-0">
            <Stethoscope size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "المستلزمات الطبية" : "Medical Supplies"}</p>
            <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
              {suppliesSum.toLocaleString()} <span className="text-[10px] text-slate-400">EGP</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-white dark:bg-[#131E2E] text-[#1A4B8C] dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BarChart3 size={15} />
          <span>{isRTL ? "التحليلات والرسوم البيانية" : "Visual Analytics & Overview"}</span>
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "expenses"
              ? "bg-white dark:bg-[#131E2E] text-rose-600 dark:text-rose-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Receipt size={15} />
          <span>{isRTL ? `سجل المصروفات (${currentRecord.expenses.length})` : `Expenses Log (${currentRecord.expenses.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("revenues")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "revenues"
              ? "bg-white dark:bg-[#131E2E] text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <DollarSign size={15} />
          <span>{isRTL ? `سجل الإيرادات (${currentRecord.revenues.length})` : `Revenue Stream (${currentRecord.revenues.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab("pnl")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pnl"
              ? "bg-white dark:bg-[#131E2E] text-purple-600 dark:text-purple-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText size={15} />
          <span>{isRTL ? "قائمة الدخل والأرباح (P&L)" : "P&L Statement"}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Multi-Bar Weekly Comparison Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isRTL ? "منحنى الإيرادات والمصروفات وصافي الربح الأسبوعي" : "Weekly Revenue vs Expenses vs Net Profit"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? "تتبع الأداء المالي الأسبوعي لشهر " + (isRTL ? currentRecord.monthNameAr : currentRecord.monthNameEn) : "Weekly financial trajectory in EGP"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#1A4B8C] dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A4B8C]"></span>
                    {isRTL ? "الإيرادات" : "Revenue"}
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    {isRTL ? "المصروفات" : "Expenses"}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {isRTL ? "صافي الربح" : "Net Profit"}
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentRecord.weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey={isRTL ? "weekAr" : "week"} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#131E2E",
                        border: "1px solid #1E2D42",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value: unknown, name: unknown) => [
                        `${value} EGP`,
                        name === "revenue"
                          ? isRTL ? "الإيرادات" : "Revenue"
                          : name === "expenses"
                          ? isRTL ? "المصروفات" : "Expenses"
                          : isRTL ? "صافي الربح" : "Net Profit",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#1A4B8C" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="netProfit" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses Distribution Donut Chart */}
            <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {isRTL ? "توزيع المصروفات حسب البند" : "Expense Category Allocation"}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isRTL ? "نسبة كل مصروف من إجمالي ميزانية العيادة" : "Share of each expense item"}
                </p>
              </div>

              <div className="h-56 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#131E2E",
                        border: "1px solid #1E2D42",
                        borderRadius: "14px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value: unknown) => [`${value} EGP`, isRTL ? "المبلغ" : "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "الإجمالي" : "Total"}</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    {totalExpenses.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">EGP</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pe-1">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {isRTL ? cat.labelAr : cat.labelEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">{cat.percentage}%</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cat.amount.toLocaleString()} EGP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES MANAGEMENT */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="doctech-input-icon" size={16} />
              <input
                type="text"
                placeholder={isRTL ? "بحث في المصروفات، البند، أو المستلم..." : "Search expenses by title or vendor..."}
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="doctech-input !h-10 text-xs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setExpenseCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  expenseCategoryFilter === "all"
                    ? "bg-[#1A4B8C] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isRTL ? "كافة التصنيفات" : "All Categories"}
              </button>
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setExpenseCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    expenseCategoryFilter === cat.id
                      ? "bg-[#1A4B8C] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {isRTL ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses Table / Cards */}
          <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">{isRTL ? "لا توجد مصروفات مسجلة تطابق البحث" : "No expenses found"}</p>
                <p className="text-xs">{isRTL ? "اضغط على زر 'إضافة مصروف' لتسجيل بند جديد" : "Click 'Add Expense' to record a new item"}</p>
              </div>
            ) : (
              filteredExpenses.map((expense) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.id === expense.category) || EXPENSE_CATEGORIES[0];
                const Icon = catInfo.icon;

                return (
                  <div
                    key={expense.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {isRTL ? expense.titleAr : expense.titleEn}
                          </h3>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                          >
                            {isRTL ? catInfo.labelAr : catInfo.labelEn}
                          </span>
                          {expense.isRecurring && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                              {isRTL ? "دوري شهري ↻" : "Recurring ↻"}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {expense.date} • {isRTL ? "طريقة السداد: " : "Method: "}
                          {expense.paymentMethod === "CASH"
                            ? isRTL ? "نقدي" : "Cash"
                            : expense.paymentMethod === "CARD"
                            ? isRTL ? "فيزا/بطاقة" : "Card"
                            : isRTL ? "تحويل بنكي" : "Bank Transfer"}
                          {expense.paidTo && ` • ${isRTL ? "الجهة: " : "To: "} ${expense.paidTo}`}
                        </p>
                        {expense.notes && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic">
                            &quot;{expense.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <span className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                        -{expense.amount.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
                      </span>

                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title={isRTL ? "حذف المصروف" : "Delete Expense"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REVENUES LOG */}
      {activeTab === "revenues" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "سجل إيرادات الكشوفات والخدمات" : "Patient Revenue & Consultations"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isRTL ? "الكشوفات والاستشارات والإجراءات الطبية المسجلة" : "Detailed consultation intake and procedure fees"}
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-mono">
              {grossRevenue.toLocaleString()} EGP
            </span>
          </div>

          <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {currentRecord.revenues.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <DollarSign size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">{isRTL ? "لا توجد إيرادات مفصلة مسجلة بهذا الشهر" : "No individual revenue logs recorded"}</p>
              </div>
            ) : (
              currentRecord.revenues.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {isRTL ? rev.patientNameAr : rev.patientName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {isRTL ? rev.typeNameAr : rev.typeNameEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rev.date} • {rev.time} • {rev.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +{rev.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                      {isRTL ? "محصل ✓" : "PAID ✓"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROFIT & LOSS STATEMENT */}
      {activeTab === "pnl" && (
        <ProfitLossStatement
          monthName={isRTL ? currentRecord.monthNameAr : currentRecord.monthNameEn}
          grossRevenue={grossRevenue}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          profitMargin={profitMargin}
          expenses={currentRecord.expenses}
          revenues={currentRecord.revenues}
          isRTL={isRTL}
        />
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        isRTL={isRTL}
        initialData={editingExpense}
      />

      {/* Revenue Modal */}
      <RevenueModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        onSave={handleSaveRevenue}
        isRTL={isRTL}
      />
    </div>
  );
}

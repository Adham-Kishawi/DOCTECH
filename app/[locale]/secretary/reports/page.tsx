"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Search,
  AlertTriangle,
  Stethoscope,
  Pill,
  Printer,
  Calendar,
  Clock,
  User,
  Filter,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Share2,
  Users,
  Download,
  MessageCircle,
  Send,
  UserCheck,
} from "lucide-react";
import {
  CLINIC_DOCTORS,
  MOCK_CLINICAL_HISTORY,
  ClinicalHistoryItem,
  ClinicalRecordType,
  DoctorProfile,
} from "@/lib/doctor/historyData";
import { SecretaryHistoryDetailModal } from "@/components/secretary/reports/SecretaryHistoryDetailModal";
import { toast } from "sonner";

export default function SecretaryReportsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  // Items State (allows secretary to update triage status / vitals / doctor in memory)
  const [historyItems, setHistoryItems] = useState<ClinicalHistoryItem[]>(MOCK_CLINICAL_HISTORY);

  // Selected Doctor Filter ('all' or doctorId)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");

  // Category Filter ('ALL' | 'TRIAGE_REPORT' | 'CONSULTATION' | 'PRESCRIPTION')
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Status Filter ('all' | 'pending_action' | 'reviewed' | 'completed')
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Date Range Filter ('all' | 'today' | 'week' | 'month')
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  // Search input
  const [search, setSearch] = useState("");

  // Selected item for modal
  const [selectedItem, setSelectedItem] = useState<ClinicalHistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active Doctor object if a specific doctor is selected
  const activeDoctor = useMemo(() => {
    return CLINIC_DOCTORS.find((d) => d.id === selectedDoctorId) || null;
  }, [selectedDoctorId]);

  // Filtered History list
  const filteredHistory = useMemo(() => {
    return historyItems.filter((item) => {
      // 1. Doctor filter
      if (selectedDoctorId !== "all" && item.doctorId !== selectedDoctorId) {
        return false;
      }

      // 2. Category filter
      if (activeCategory !== "ALL" && item.type !== activeCategory) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // 4. Date range filter
      if (dateRange === "today" && item.date !== "2026-09-03") {
        return false;
      }
      if (dateRange === "week" && !item.date.startsWith("2026-09")) {
        return false;
      }

      // 5. Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName =
          item.patientName.toLowerCase().includes(query) ||
          item.patientNameAr.includes(query);
        const matchId = item.recordNumber.toLowerCase().includes(query);
        const matchDiagnosis =
          item.diagnosis?.toLowerCase().includes(query) ||
          item.diagnosisAr?.includes(query);
        const matchTitle =
          item.title.toLowerCase().includes(query) ||
          item.titleAr.includes(query);

        if (!matchName && !matchId && !matchDiagnosis && !matchTitle) {
          return false;
        }
      }

      return true;
    });
  }, [historyItems, selectedDoctorId, activeCategory, statusFilter, dateRange, search]);

  // Aggregate stats based on current doctor filter
  const stats = useMemo(() => {
    const baseItems =
      selectedDoctorId === "all"
        ? historyItems
        : historyItems.filter((i) => i.doctorId === selectedDoctorId);

    const pendingTriage = baseItems.filter((i) => i.status === "pending_action").length;
    const sentToDoctor = baseItems.filter((i) => i.status === "reviewed" && i.type === "TRIAGE_REPORT").length;
    const doctorReplied = baseItems.filter((i) => i.diagnosis && i.status !== "completed").length;
    const dispatched = baseItems.filter((i) => i.status === "completed").length;

    return {
      total: baseItems.length,
      pendingTriage,
      sentToDoctor,
      doctorReplied,
      dispatched,
    };
  }, [historyItems, selectedDoctorId]);

  const handleOpenDetail = (item: ClinicalHistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleUpdateItem = (updated: ClinicalHistoryItem) => {
    setHistoryItems((prev) =>
      prev.map((it) => (it.id === updated.id ? updated : it))
    );
    setSelectedItem(updated);
  };

  const handleQuickWhatsAppDispatch = (e: React.MouseEvent, item: ClinicalHistoryItem) => {
    e.stopPropagation();
    const doc = CLINIC_DOCTORS.find((d) => d.id === item.doctorId) || CLINIC_DOCTORS[0];
    const text = isRTL
      ? `مرحباً أستاذ/ة ${item.patientNameAr}، معك مكتب الاستقبال بعيادة DOCTECH. تم اعتماد تقريرك/روشتتك (${item.recordNumber}) لدى ${doc.nameAr}. نتمنى لك دوام العافية.`
      : `Hello ${item.patientName}, your medical record (${item.recordNumber}) with ${doc.name} has been processed by reception.`;

    const cleanPhone = item.patientPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");

    // Mark as completed
    handleUpdateItem({ ...item, status: "completed" });
    toast.success(isRTL ? "تم فتح واتساب وتحديث الحالة إلى تم التسليم" : "Opened WhatsApp & marked as dispatched");
  };

  const handleExportSummary = () => {
    window.print();
    toast.success(isRTL ? "تم تجهيز ملخص الفرز والتقارير للطباعة" : "Triage summary prepared for printing");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ━━━ 1. PAGE HEADER ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 mb-2">
            <Activity size={13} />
            {isRTL ? "مكتب فرز التقارير وإدارة السجلات السريرية" : "Reports Triage & Clinical Intake Desk"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "فرز التقارير وسجل الحالات" : "Clinical Triage & Reports Desk"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {isRTL
              ? "استقبال وفرز استفسارات المرضى، توجيه الحالات للأطباء، تسجيل العلامات الحيوية، وتسليم الروشتات والقرارات الطبية للمرضى"
              : "Intake patient inquiries, route urgent triage to physicians, record vital signs, and dispatch medical prescriptions"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportSummary}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>{isRTL ? "طباعة الملخص" : "Print Summary"}</span>
          </button>
        </div>
      </div>

      {/* ━━━ 2. DOCTOR SELECTOR TABS & ACTIVE DOCTOR PROFILE ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5 sm:p-6 space-y-5">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            {isRTL ? "تصفية السجلات حسب الطبيب المعالج:" : "Filter Records by Attending Physician:"}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All Doctors option */}
            <button
              onClick={() => setSelectedDoctorId("all")}
              className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedDoctorId === "all"
                  ? "bg-[#0891B2] text-white shadow-md shadow-cyan-900/15"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Users size={15} />
              <span>{isRTL ? "جميع أطباء العيادة" : "All Clinic Doctors"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {historyItems.length}
              </span>
            </button>

            {/* Individual Doctors */}
            {CLINIC_DOCTORS.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#0891B2] text-white shadow-md shadow-cyan-900/15"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? "bg-white text-[#0891B2]" : doc.avatarBg
                    }`}
                  >
                    {doc.initials}
                  </span>
                  <span>{isRTL ? doc.nameAr : doc.name}</span>
                  <span className="text-[10px] opacity-75 font-medium hidden md:inline">
                    ({isRTL ? doc.specialtyAr : doc.specialty})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Doctor Profile Banner (if specific doctor selected) */}
        {activeDoctor && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-50/70 via-slate-50 to-blue-50/40 dark:from-cyan-950/20 dark:via-slate-900 dark:to-blue-950/10 border border-cyan-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-13 h-13 rounded-2xl ${activeDoctor.avatarBg} font-black text-lg flex items-center justify-center shrink-0 shadow-sm`}
              >
                {activeDoctor.initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {isRTL ? activeDoctor.nameAr : activeDoctor.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {activeDoctor.licenseId}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#0891B2] dark:text-cyan-400 mt-0.5">
                  {isRTL ? activeDoctor.titleAr : activeDoctor.title} • {isRTL ? activeDoctor.departmentAr : activeDoctor.department}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "إجمالي الحالات" : "Total Cases"}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {activeDoctor.totalCases}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "روشتات صادرة" : "Prescriptions"}
                </span>
                <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                  {activeDoctor.totalPrescriptions}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "بانتظار الفرز" : "Pending Intake"}
                </span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {activeDoctor.pendingReviews}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ 3. SECRETARY WORKFLOW KPI CARDS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === "pending_action" ? "all" : "pending_action")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3.5 ${
            statusFilter === "pending_action"
              ? "bg-amber-50/70 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700"
              : "bg-white dark:bg-[#131E2E] border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "بانتظار الفرز" : "Pending Triage"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.pendingTriage}
            </p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "reviewed" ? "all" : "reviewed")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3.5 ${
            statusFilter === "reviewed"
              ? "bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700"
              : "bg-white dark:bg-[#131E2E] border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "أُرسلت للأطباء" : "Sent to Doctor"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.sentToDoctor}
            </p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("all")}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "قرارات معتمدة" : "Doctor Replied"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.doctorReplied}
            </p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-3.5 ${
            statusFilter === "completed"
              ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700"
              : "bg-white dark:bg-[#131E2E] border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "تم التسليم للمريض" : "Dispatched"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.dispatched}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ 4. FILTER TOOLBAR (Search, Categories, Date Range) ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="doctech-input-icon" size={16} />
            <input
              type="text"
              placeholder={
                isRTL
                  ? "بحث باسم المريض، كود السجل، أو التشخيص..."
                  : "Search patient name, record #, or diagnosis..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="doctech-input !h-10 text-xs"
            />
          </div>

          {/* Date Range Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl self-start md:self-auto">
            {[
              { id: "all", en: "All Time", ar: "كل الفترات" },
              { id: "today", en: "Today", ar: "اليوم" },
              { id: "week", en: "This Week", ar: "هذا الأسبوع" },
              { id: "month", en: "This Month", ar: "هذا الشهر" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as typeof dateRange)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === d.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isRTL ? d.ar : d.en}
              </button>
            ))}
          </div>
        </div>

        {/* Category Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3 scrollbar-none">
          {[
            { id: "ALL", en: "All Records", ar: "السجل الشامل", count: historyItems.length },
            { id: "TRIAGE_REPORT", en: "Triage Reports", ar: "فرز واستفسارات المرضى", count: historyItems.filter((i) => i.type === "TRIAGE_REPORT").length },
            { id: "CONSULTATION", en: "Consultations", ar: "كشوفات سريرية", count: historyItems.filter((i) => i.type === "CONSULTATION").length },
            { id: "PRESCRIPTION", en: "Prescriptions", ar: "روشتات معتمدة", count: historyItems.filter((i) => i.type === "PRESCRIPTION").length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeCategory === cat.id
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{isRTL ? cat.ar : cat.en}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ 5. CLINICAL HISTORY & TRIAGE LIST ━━━ */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {isRTL ? "لا توجد سجلات تطابق الفلتر الحالي" : "No triage records matching your filters"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isRTL
              ? "جرّبي تغيير الطبيب، أو إزالة البحث لتظهر السجلات التاريخية."
              : "Try switching the physician or clearing your search filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isConsult = item.type === "CONSULTATION";
            const isPrescription = item.type === "PRESCRIPTION";
            const isTriage = item.type === "TRIAGE_REPORT";

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className="p-4 sm:p-5 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Icon Stamp */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isConsult
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                        : isPrescription
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-900"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                    }`}
                  >
                    {isConsult && <Stethoscope size={20} />}
                    {isPrescription && <Pill size={20} />}
                    {isTriage && <AlertTriangle size={20} />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    {/* Top Row: Patient Name, Urgency, Status, ID */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0891B2] dark:group-hover:text-cyan-400 transition-colors">
                        {isRTL ? item.patientNameAr : item.patientName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.patientAge} {isRTL ? "سنة" : "yrs"}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400 hidden sm:inline">
                        ({item.recordNumber})
                      </span>
                      
                      {/* Urgency Badge */}
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          item.urgency === "High"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            : item.urgency === "Medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {item.urgency}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : item.status === "reviewed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {item.status === "completed"
                          ? isRTL ? "تم التسليم" : "Dispatched"
                          : item.status === "reviewed"
                          ? isRTL ? "أُرسلت للطبيب" : "With Doctor"
                          : isRTL ? "بانتظار الفرز" : "Pending Intake"}
                      </span>
                    </div>

                    {/* Title / Diagnosis */}
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {isRTL ? item.titleAr : item.title}
                    </p>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 leading-relaxed">
                      {item.diagnosis
                        ? (isRTL ? `قرار الطبيب: ${item.diagnosisAr || item.diagnosis}` : `Doctor Decision: ${item.diagnosis}`)
                        : item.symptoms
                        ? (isRTL ? `الأعراض والشكوى: ${item.symptomsAr || item.symptoms}` : `Intake Symptoms: ${item.symptoms}`)
                        : ""}
                    </p>

                    {/* Metadata bar */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                      <span>👤 {isRTL ? item.doctorNameAr : item.doctorName}</span>
                      <span>•</span>
                      <span>📅 {isRTL ? item.relativeTimeAr : item.relativeTimeEn}</span>
                      {item.vitals?.bp && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            💓 BP: {item.vitals.bp}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions for Secretary */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={(e) => handleQuickWhatsAppDispatch(e, item)}
                    className="h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                    title={isRTL ? "إرسال للمريض عبر واتساب" : "Dispatch via WhatsApp"}
                  >
                    <MessageCircle size={13} />
                    <span className="hidden md:inline">{isRTL ? "واتساب" : "WhatsApp"}</span>
                  </button>

                  <span className="text-xs font-bold text-[#0891B2] dark:text-cyan-400 group-hover:underline flex items-center gap-1 pl-1">
                    <span>{isRTL ? "الفرز والتفاصيل" : "Triage & Edit"}</span>
                    <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ━━━ 6. SECRETARY DETAIL & TRIAGE MODAL ━━━ */}
      <SecretaryHistoryDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateItem={handleUpdateItem}
        isRTL={isRTL}
      />
    </div>
  );
}

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
} from "lucide-react";
import {
  CLINIC_DOCTORS,
  MOCK_CLINICAL_HISTORY,
  ClinicalHistoryItem,
  ClinicalRecordType,
  DoctorProfile,
} from "@/lib/doctor/historyData";
import { ClinicalHistoryDetailModal } from "@/components/doctor/reports/ClinicalHistoryDetailModal";
import { toast } from "sonner";

export default function DoctorReportsListPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  // Selected Doctor Filter ('all' or doctorId)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("doc-1");

  // Category Filter ('ALL' | 'CONSULTATION' | 'PRESCRIPTION' | 'TRIAGE_REPORT')
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

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
    return MOCK_CLINICAL_HISTORY.filter((item) => {
      // 1. Doctor filter
      if (selectedDoctorId !== "all" && item.doctorId !== selectedDoctorId) {
        return false;
      }

      // 2. Category filter
      if (activeCategory !== "ALL" && item.type !== activeCategory) {
        return false;
      }

      // 3. Date range filter
      if (dateRange === "today" && item.date !== "2026-09-03") {
        return false;
      }
      if (dateRange === "week" && !item.date.startsWith("2026-09")) {
        return false;
      }

      // 4. Search query
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
  }, [selectedDoctorId, activeCategory, dateRange, search]);

  // Aggregate stats based on current doctor filter
  const stats = useMemo(() => {
    const baseItems =
      selectedDoctorId === "all"
        ? MOCK_CLINICAL_HISTORY
        : MOCK_CLINICAL_HISTORY.filter((i) => i.doctorId === selectedDoctorId);

    const consultations = baseItems.filter((i) => i.type === "CONSULTATION").length;
    const prescriptions = baseItems.filter((i) => i.type === "PRESCRIPTION").length;
    const triageReports = baseItems.filter((i) => i.type === "TRIAGE_REPORT").length;
    const highUrgency = baseItems.filter((i) => i.urgency === "High").length;

    return {
      total: baseItems.length,
      consultations,
      prescriptions,
      triageReports,
      highUrgency,
    };
  }, [selectedDoctorId]);

  const handleOpenDetail = (item: ClinicalHistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleExportSummary = () => {
    window.print();
    toast.success(isRTL ? "تم تجهيز ملخص السجل للطباعة والتصدير" : "Clinical history summary prepared for printing");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ━━━ 1. PAGE HEADER ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-2">
            <Activity size={13} />
            {isRTL ? "السجل السريري الشامل للأطباء والتقارير" : "Physician Clinical History & Medical Hub"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "تاريخ الحالات والتقارير الطبية" : "Clinical History & Case Reports"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {isRTL
              ? "متابعة السجل الكامل لتشخيصات وروشتات وتقارير أطباء العيادة، ومراجعة استفسارات الفرز السريري بدقة واحترافية"
              : "Review complete medical records, issued prescriptions, and urgent triage inquiries for all clinic physicians"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleExportSummary}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>{isRTL ? "طباعة السجل" : "Print Summary"}</span>
          </button>
        </div>
      </div>

      {/* ━━━ 2. DOCTOR SELECTOR TABS & ACTIVE DOCTOR PROFILE ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5 sm:p-6 space-y-5">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            {isRTL ? "اختر الطبيب لاستعراض سجله السريري:" : "Select Physician to View Clinical History:"}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All Doctors option */}
            <button
              onClick={() => setSelectedDoctorId("all")}
              className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedDoctorId === "all"
                  ? "bg-[#1A4B8C] text-white shadow-md shadow-blue-900/15"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Users size={15} />
              <span>{isRTL ? "جميع أطباء العيادة" : "All Clinic Doctors"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {MOCK_CLINICAL_HISTORY.length}
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
                      ? "bg-[#1A4B8C] text-white shadow-md shadow-blue-900/15"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? "bg-white text-[#1A4B8C]" : doc.avatarBg
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
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/40 dark:from-blue-950/20 dark:via-slate-900 dark:to-emerald-950/10 border border-blue-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <p className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400 mt-0.5">
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
                  {isRTL ? "تقارير معلقة" : "Pending Reviews"}
                </span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {activeDoctor.pendingReviews}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ 3. QUICK STATS CARDS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "كشوفات سريرية" : "Consultations"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.consultations}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "روشتات صادرة" : "Prescriptions"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.prescriptions}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "تقارير وفرز طبي" : "Triage Inquiries"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.triageReports}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "سجلات اليوم" : "Today Records"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.total}
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
                  ? "بحث باسم المريض، التشخيص، أو كود السجل..."
                  : "Search patient, diagnosis, or record #..."
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
            { id: "ALL", en: "All History", ar: "السجل الكامل", count: stats.total },
            { id: "CONSULTATION", en: "Consultations", ar: "كشوفات وتشخيصات", count: stats.consultations },
            { id: "PRESCRIPTION", en: "Prescriptions", ar: "روشتات وعلاجات", count: stats.prescriptions },
            { id: "TRIAGE_REPORT", en: "Triage Reports", ar: "تقارير وفرز سريري", count: stats.triageReports },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeCategory === cat.id
                  ? "bg-[#1A4B8C] text-white shadow-xs"
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

      {/* ━━━ 5. CLINICAL HISTORY LIST ━━━ */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {isRTL ? "لا توجد سجلات تطابق الفلتر الحالي" : "No records matching your filters"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isRTL
              ? "جرّب تغيير الطبيب، أو إزالة البحث لتظهر السجلات التاريخية."
              : "Try switching the physician or clearing your search term."}
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
                className="p-4 sm:p-5 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                    {/* Top Row: Patient Name, Type Badge, ID */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#1A4B8C] dark:group-hover:text-blue-400 transition-colors">
                        {isRTL ? item.patientNameAr : item.patientName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.patientAge} {isRTL ? "سنة" : "yrs"}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400 hidden sm:inline">
                        ({item.recordNumber})
                      </span>
                      {item.urgency === "High" && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                          {isRTL ? "عاجل" : "Urgent"}
                        </span>
                      )}
                    </div>

                    {/* Title / Diagnosis */}
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {isRTL ? item.titleAr : item.title}
                    </p>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 leading-relaxed">
                      {item.diagnosis
                        ? (isRTL ? `التشخيص: ${item.diagnosisAr || item.diagnosis}` : `Diagnosis: ${item.diagnosis}`)
                        : item.symptoms
                        ? (isRTL ? `الأعراض: ${item.symptomsAr || item.symptoms}` : `Symptoms: ${item.symptoms}`)
                        : ""}
                    </p>

                    {/* Metadata bar */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                      <span>👤 {isRTL ? item.doctorNameAr : item.doctorName}</span>
                      <span>•</span>
                      <span>📅 {isRTL ? item.relativeTimeAr : item.relativeTimeEn}</span>
                      {item.medicines && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            💊 {item.medicines.length} {isRTL ? "أدوية موصوفة" : "Medications"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Arrow / Action */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-xs font-bold text-[#1A4B8C] dark:text-blue-400 group-hover:underline flex items-center gap-1">
                    <span>{isRTL ? "استعراض السجل" : "View Record"}</span>
                    <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ━━━ 6. DETAIL MODAL ━━━ */}
      <ClinicalHistoryDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isRTL={isRTL}
      />
    </div>
  );
}

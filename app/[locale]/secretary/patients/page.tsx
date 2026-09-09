"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  ArrowRight,
  UserPlus,
  MessageCircle,
  Phone,
  Calendar,
  Activity,
  FileText,
  ChevronRight,
  Filter,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  gender: "Male" | "Female";
  genderAr: "ذكر" | "أنثى";
  age: number;
  lastVisit: string;
  lastVisitAr: string;
  totalVisits: number;
  condition: string;
  conditionAr: string;
}

const initialPatientsData: Patient[] = [
  {
    id: "PAT-001",
    name: "Ahmed Hassan",
    nameAr: "أحمد حسن",
    phone: "+20 100 123 4567",
    gender: "Male",
    genderAr: "ذكر",
    age: 42,
    lastVisit: "Today",
    lastVisitAr: "اليوم",
    totalVisits: 5,
    condition: "Hypertension (Stage 1)",
    conditionAr: "ارتفاع ضغط الدم (مرحلة أولى)",
  },
  {
    id: "PAT-002",
    name: "Sara Ibrahim",
    nameAr: "سارة إبراهيم",
    phone: "+20 102 345 6789",
    gender: "Female",
    genderAr: "أنثى",
    age: 29,
    lastVisit: "10 days ago",
    lastVisitAr: "منذ ١٠ أيام",
    totalVisits: 2,
    condition: "Routine Consultation",
    conditionAr: "استشارة ومتابعة",
  },
  {
    id: "PAT-003",
    name: "Mohamed Ali",
    nameAr: "محمد علي",
    phone: "+20 103 456 7890",
    gender: "Male",
    genderAr: "ذكر",
    age: 55,
    lastVisit: "2 weeks ago",
    lastVisitAr: "منذ أسبوعين",
    totalVisits: 8,
    condition: "Post-Cardiac Stent Follow-up",
    conditionAr: "متابعة ما بعد دعامة القلب",
  },
  {
    id: "PAT-004",
    name: "Fatima Omar",
    nameAr: "فاطمة عمر",
    phone: "+20 104 567 8901",
    gender: "Female",
    genderAr: "أنثى",
    age: 34,
    lastVisit: "1 month ago",
    lastVisitAr: "منذ شهر",
    totalVisits: 3,
    condition: "Prescription Refill",
    conditionAr: "تجديد علاج شهري",
  },
  {
    id: "PAT-005",
    name: "Kareem Tarek",
    nameAr: "كريم طارق",
    phone: "+20 105 678 9012",
    gender: "Male",
    genderAr: "ذكر",
    age: 46,
    lastVisit: "3 days ago",
    lastVisitAr: "منذ ٣ أيام",
    totalVisits: 4,
    condition: "Hyperpyrexia post-antibiotics",
    conditionAr: "حرارة مستمرة بعد العلاج",
  },
  {
    id: "PAT-006",
    name: "Nouran Mahmoud",
    nameAr: "نوران محمود",
    phone: "+20 102 345 6789",
    gender: "Female",
    genderAr: "أنثى",
    age: 32,
    lastVisit: "Yesterday",
    lastVisitAr: "أمس",
    totalVisits: 6,
    condition: "Diabetes Type 2 Follow-up",
    conditionAr: "متابعة سكري النوع الثاني",
  },
];

export default function SecretaryPatientsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [patients, setPatients] = useState<Patient[]>(initialPatientsData);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (genderFilter !== "all" && p.gender !== genderFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName =
          p.name.toLowerCase().includes(q) || p.nameAr.includes(q);
        const matchPhone = p.phone.includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchCondition =
          p.condition.toLowerCase().includes(q) || p.conditionAr.includes(q);

        if (!matchName && !matchPhone && !matchId && !matchCondition) {
          return false;
        }
      }
      return true;
    });
  }, [patients, genderFilter, search]);

  const stats = useMemo(() => {
    const total = patients.length;
    const male = patients.filter((p) => p.gender === "Male").length;
    const female = patients.filter((p) => p.gender === "Female").length;
    const activeThisMonth = patients.filter((p) => !p.lastVisit.includes("month")).length;

    return { total, male, female, activeThisMonth };
  }, [patients]);

  const handleWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const msg = isRTL
      ? `مرحباً أستاذ/ة ${name}، نتواصل معك من مكتب استقبال عيادة DOCTECH للاطمئنان على صحتك.`
      : `Hello ${name}, this is DocTech Clinic reception following up on your health.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ━━━ 1. PAGE HEADER ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 mb-2">
            <Users size={13} />
            {isRTL ? "سجل ودليل المرضى الإلكتروني (EMR)" : "Clinic Patient Directory & Medical Records"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "دليل وسجلات المرضى" : "Patient Directory & EMR"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {isRTL
              ? "البحث في ملفات المرضى، متابعة التاريخ السريري، فحص المرفقات والروشتات، والتواصل الفوري عبر الواتساب"
              : "Search patient profiles, review historical visits, clinical attachments, and initiate WhatsApp conversations"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="h-10 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/15 cursor-pointer active:scale-95"
          >
            <UserPlus size={15} />
            <span>{isRTL ? "تسجيل مريض جديد" : "New Patient Visit"}</span>
          </Link>
        </div>
      </div>

      {/* ━━━ 2. KPI SUMMARY CARDS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "إجمالي المسجلين" : "Registered Patients"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "نشطين هذا الشهر" : "Active This Month"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.activeThisMonth}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "مرضى ذكور" : "Male Patients"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.male}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "مريضات إناث" : "Female Patients"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.female}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ 3. FILTER & SEARCH TOOLBAR ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={
              isRTL
                ? "بحث بالاسم، رقم الهاتف، أو كود المريض (PAT-001)..."
                : "Search patient name, phone, or ID (PAT-001)..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[
            { id: "all", en: "All Patients", ar: "جميع المرضى" },
            { id: "Male", en: "Male", ar: "ذكور" },
            { id: "Female", en: "Female", ar: "إناث" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setGenderFilter(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                genderFilter === st.id
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? st.ar : st.en}
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ 4. PATIENT DIRECTORY LIST ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            {isRTL
              ? "لا يوجد مرضى يطابقون معايير البحث الحالية."
              : "No patients found matching your search term."}
          </div>
        ) : (
          filtered.map((patient) => (
            <Link
              key={patient.id}
              href={`/${locale}/secretary/patients/${patient.id}`}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] dark:text-cyan-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900 shadow-2xs">
                  {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0891B2] dark:group-hover:text-cyan-400 transition-colors">
                      {isRTL ? patient.nameAr : patient.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                      ({patient.id})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isRTL ? patient.genderAr : patient.gender} • {patient.age} {isRTL ? "سنة" : "yrs"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="text-slate-400" />
                      <span dir="ltr">{patient.phone}</span>
                    </span>
                    <span>•</span>
                    <span>
                      {isRTL ? `آخر كشف: ${patient.lastVisitAr}` : `Last Visit: ${patient.lastVisit}`}
                    </span>
                    <span>•</span>
                    <span className="text-[#0891B2] font-bold">
                      {patient.totalVisits} {isRTL ? "زيارات وكشوفات" : "Visits"}
                    </span>
                  </p>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {isRTL ? `التشخيص/الحالة: ${patient.conditionAr}` : `Condition: ${patient.condition}`}
                  </p>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleWhatsApp(e, patient.phone, isRTL ? patient.nameAr : patient.name)}
                  className="h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                  title={isRTL ? "محادثة واتساب" : "WhatsApp"}
                >
                  <MessageCircle size={13} />
                  <span className="hidden sm:inline">{isRTL ? "واتساب" : "WhatsApp"}</span>
                </button>

                <span className="text-xs font-bold text-[#0891B2] dark:text-cyan-400 group-hover:underline flex items-center gap-1 pl-1">
                  <span>{isRTL ? "فتح الملف الطبي" : "Open EMR"}</span>
                  <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

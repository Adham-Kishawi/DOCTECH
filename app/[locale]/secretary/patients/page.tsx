"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  MessageCircle,
  Phone,
  Activity,
  ChevronRight,
  Filter,
  Loader2,
  Calendar,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender: "Male" | "Female" | "Unknown";
  genderAr: string;
  age: number;
  lastVisit: string;
  lastVisitAr: string;
  totalVisits: number;
  notes?: string;
  address?: string;
}

export default function SecretaryPatientsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const res = await fetch("/api/patients");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPatients(json.data);
        }
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (genderFilter !== "all" && p.gender !== genderFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchPhone = p.phone.includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;

        if (!matchName && !matchPhone && !matchId && !matchNotes) {
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
    const activeThisMonth = patients.filter((p) => p.totalVisits > 0).length;

    return { total, male, female, activeThisMonth };
  }, [patients]);

  const handleWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? `20${cleanPhone.slice(1)}` : cleanPhone;
    const msg = isRTL
      ? `مرحباً أستاذ/ة ${name}، نتواصل معك من مكتب استقبال عيادة DOCTECH للاطمئنان على صحتك.`
      : `Hello ${name}, this is DocTech Clinic reception following up on your health.`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
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
              ? "البحث في ملفات المرضى الحقيقية المسجلة، متابعة الكشوفات، والتواصل المباشر عبر الواتساب"
              : "Search live patient profiles, review historical visits, clinical notes, and chat on WhatsApp"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="h-10 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/15 cursor-pointer active:scale-95"
          >
            <UserPlus size={15} />
            <span>{isRTL ? "حجز كشف لمريض" : "New Patient Booking"}</span>
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
              {loading ? "-" : stats.total}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "مرضى لديهم زيارات" : "Patients with Visits"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {loading ? "-" : stats.activeThisMonth}
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
              {loading ? "-" : stats.male}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "مرضى إناث" : "Female Patients"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {loading ? "-" : stats.female}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ 3. FILTER & SEARCH TOOLBAR ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={17} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم، الهاتف، أو الملاحظات..." : "Search by name, phone, notes..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <Filter size={13} className="text-slate-400 ms-2" />
            <button
              onClick={() => setGenderFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === "all"
                  ? "bg-white dark:bg-[#131E2E] text-[#0891B2] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isRTL ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setGenderFilter("Male")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === "Male"
                  ? "bg-white dark:bg-[#131E2E] text-[#0891B2] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isRTL ? "ذكور" : "Male"}
            </button>
            <button
              onClick={() => setGenderFilter("Female")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === "Female"
                  ? "bg-white dark:bg-[#131E2E] text-[#0891B2] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isRTL ? "إناث" : "Female"}
            </button>
          </div>
        </div>
      </div>

      {/* ━━━ 4. PATIENT DIRECTORY CONTENT ━━━ */}
      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 size={32} className="animate-spin text-[#0891B2] mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {isRTL ? "جاري تحميل سجلات المرضى من قاعدة البيانات..." : "Loading patient directory from database..."}
          </p>
        </div>
      ) : patients.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isRTL ? "لا يوجد مرضى مسجلون حالياً" : "No Registered Patients Yet"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 font-medium">
            {isRTL
              ? "سجل المرضى في قاعدة البيانات خالٍ حالياً. يمكنك حجز كشف لمريض جديد ليتم حفظ بياناته هنا تلقائياً."
              : "The patient registry in your database is currently empty. Book an appointment to register your first patient."}
          </p>
          <div className="mt-6">
            <Link
              href={`/${locale}/secretary/appointments/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>{isRTL ? "تسجيل مريض وحجز كشف الآن" : "Register Patient & Book Visit"}</span>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {isRTL ? "لا توجد نتائج مطابقة لبحثك." : "No patients match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <Link
              key={patient.id}
              href={`/${locale}/secretary/patients/${patient.id}`}
              className="p-5 rounded-3xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 group-hover:text-[#0891B2] transition-colors">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0891B2] transition-colors">
                        {patient.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                        {isRTL ? patient.genderAr : patient.gender}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {patient.totalVisits} {isRTL ? "زيارات" : "visits"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[11px]">
                      {isRTL ? `آخر موعد: ${patient.lastVisitAr}` : `Last visit: ${patient.lastVisit}`}
                    </span>
                  </div>
                  {patient.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic mt-1">
                      {patient.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleWhatsApp(e, patient.phone, patient.name)}
                  className="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle size={13} />
                  <span>{isRTL ? "واتساب" : "WhatsApp"}</span>
                </button>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#0891B2] transition-colors">
                  <span>{isRTL ? "فتح الملف" : "View File"}</span>
                  <ChevronRight size={14} className={isRTL ? "rotate-180" : ""} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

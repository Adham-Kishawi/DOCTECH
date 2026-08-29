"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, Plus, Search, Phone, Calendar, ArrowRight, MessageCircle, FileText } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  lastVisit: string;
  totalVisits: number;
}

const patientsData: Patient[] = [
  { id: "PAT-001", name: "Ahmed Hassan", phone: "+20 100 123 4567", gender: "Male", age: 42, lastVisit: "Today", totalVisits: 5 },
  { id: "PAT-002", name: "Sara Ibrahim", phone: "+20 102 345 6789", gender: "Female", age: 29, lastVisit: "10 days ago", totalVisits: 2 },
  { id: "PAT-003", name: "Mohamed Ali", phone: "+20 103 456 7890", gender: "Male", age: 55, lastVisit: "2 weeks ago", totalVisits: 8 },
  { id: "PAT-004", name: "Fatima Omar", phone: "+20 104 567 8901", gender: "Female", age: 34, lastVisit: "1 month ago", totalVisits: 3 },
  { id: "PAT-005", name: "Kareem Tarek", phone: "+20 105 678 9012", gender: "Male", age: 46, lastVisit: "3 days ago", totalVisits: 4 },
];

export default function SecretaryPatientsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");

  const filtered = patientsData.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <Users size={13} />
            {isRTL ? "سجل ودليل المرضى الإلكتروني" : "Clinic Patient Directory & EMR"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "دليل المرضى" : "Patient Directory"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "البحث في ملفات المرضى، استعراض السجلات الطبية، والتواصل المباشر"
              : "Search patient files, inspect clinical visit history & initiate WhatsApp chats"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            {isRTL ? `إجمالي المرضى: ${patientsData.length}` : `Total Patients: ${patientsData.length}`}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم، رقم الهاتف، أو كود المريض..." : "Search patient name, phone, or ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((patient) => (
          <Link
            key={patient.id}
            href={`/${locale}/secretary/patients/${patient.id}`}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0891B2] font-extrabold text-base flex items-center justify-center shrink-0 border border-cyan-100">
                {patient.name.split(" ").map(n => n[0]).join("")}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors">
                    {patient.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">({patient.id})</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {patient.gender} • {patient.age} yrs
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-3">
                  <span>{patient.phone}</span>
                  <span>•</span>
                  <span>Last Visit: {patient.lastVisit}</span>
                  <span>•</span>
                  <span>{patient.totalVisits} Consultations</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs font-bold text-[#0891B2] group-hover:underline flex items-center gap-1">
                {isRTL ? "فتح الملف السريري" : "Open Profile"}
                <ArrowRight size={15} className={isRTL ? "rotate-180" : ""} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
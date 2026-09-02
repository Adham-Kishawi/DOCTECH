"use client";

import { useState } from "react";
import { Calendar, Stethoscope, FileText, ChevronDown, ChevronUp, Pill, Activity, Paperclip } from "lucide-react";

export interface TimelineVisit {
  id: string;
  date: string;
  doctorName: string;
  doctorNameAr: string;
  visitType: string;
  visitTypeAr: string;
  chiefComplaint: string;
  chiefComplaintAr: string;
  diagnosis: string;
  diagnosisAr: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    sugar?: string;
  };
  prescriptions?: string[];
  attachmentsCount?: number;
}

interface PatientTimelineProps {
  visits: TimelineVisit[];
  locale: string;
  isRTL: boolean;
}

export function PatientTimeline({ visits, isRTL }: PatientTimelineProps) {
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(visits[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedVisitId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative pl-4 sm:pl-6 rtl:pl-0 rtl:pr-4 sm:rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-cyan-200 dark:border-cyan-900 space-y-6">
      {visits.map((visit) => {
        const isExpanded = expandedVisitId === visit.id;

        return (
          <div key={visit.id} className="relative group">
            {/* Timeline Node Icon */}
            <div className="absolute -left-[25px] sm:-left-[33px] rtl:-left-auto rtl:-right-[25px] sm:rtl:-right-[33px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 border-2 border-[#0891B2] flex items-center justify-center text-[#0891B2] shadow-sm">
              <Stethoscope size={14} />
            </div>

            {/* Visit Card */}
            <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
              {/* Card Header (Clickable to toggle) */}
              <div
                onClick={() => toggleExpand(visit.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {isRTL ? visit.visitTypeAr : visit.visitType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">({visit.id})</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400">
                      {isRTL ? visit.doctorNameAr : visit.doctorName}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{visit.date}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px] sm:max-w-md">{isRTL ? visit.diagnosisAr : visit.diagnosis}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  {visit.attachmentsCount && visit.attachmentsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Paperclip size={10} />
                      <span>{visit.attachmentsCount}</span>
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Clinical Details */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                  {/* Complaint & Diagnosis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">
                        {isRTL ? "شكوى المريض والأعراض" : "Chief Complaint"}
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {isRTL ? visit.chiefComplaintAr : visit.chiefComplaint}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-400 text-[10px] uppercase">
                        {isRTL ? "التشخيص الطبي وقرار الطبيب" : "Clinical Diagnosis"}
                      </span>
                      <p className="font-bold text-[#0891B2] dark:text-cyan-400 mt-0.5">
                        {isRTL ? visit.diagnosisAr : visit.diagnosis}
                      </p>
                    </div>
                  </div>

                  {/* Vitals */}
                  {visit.vitals && (
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] uppercase flex items-center gap-1 mb-1.5">
                        <Activity size={12} className="text-rose-500" />
                        <span>{isRTL ? "العلامات الحيوية (Vitals)" : "Patient Vitals"}</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {visit.vitals.bp && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "ضغط الدم" : "BP"}</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{visit.vitals.bp}</span>
                          </div>
                        )}
                        {visit.vitals.pulse && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "النبض" : "Pulse"}</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{visit.vitals.pulse} bpm</span>
                          </div>
                        )}
                        {visit.vitals.temp && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "الحرارة" : "Temp"}</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{visit.vitals.temp} °C</span>
                          </div>
                        )}
                        {visit.vitals.sugar && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-center">
                            <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "السكر" : "Glucose"}</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{visit.vitals.sugar} mg/dL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] uppercase flex items-center gap-1 mb-1.5">
                        <Pill size={12} className="text-emerald-500" />
                        <span>{isRTL ? "الروشتة والعلاجات الموصوفة" : "Prescribed Medications"}</span>
                      </span>
                      <ul className="space-y-1">
                        {visit.prescriptions.map((rx, idx) => (
                          <li key={idx} className="p-2 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg font-medium text-xs flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{rx}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

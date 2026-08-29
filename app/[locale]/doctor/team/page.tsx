"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, UserPlus, Shield, CheckCircle2, Clock, Mail, Phone, MoreHorizontal } from "lucide-react";

export default function DoctorTeamPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const staff = [
    { id: "1", name: "Sarah Jenkins", role: "Head Secretary & Coordinator", email: "sarah.j@doctech-clinic.com", phone: "+20 101 234 5678", status: "Active", lastActive: "Just now", permissions: "Full CRUD, Appointments, WhatsApp" },
    { id: "2", name: "Dina Mansour", role: "Evening Receptionist", email: "dina.m@doctech-clinic.com", phone: "+20 102 345 6789", status: "Active", lastActive: "2 hours ago", permissions: "Appointments Booking" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <Users size={13} />
            {isRTL ? "إدارة طاقم وسكرتارية العيادة" : "Clinic Staff & Roles Management"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "فريق العمل (My Team)" : "Clinic Staff Directory"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "إدارة حسابات السكرتارية وتحديد الصلاحيات وإرسال دعوات الانضمام"
              : "Manage secretary accounts, operational permissions, and invite assistants"}
          </p>
        </div>

        <Link
          href={`/${locale}/doctor/team/invite`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 transition-all"
        >
          <UserPlus size={15} />
          <span>{isRTL ? "دعوة سكرتيرة جديدة" : "Invite New Secretary"}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {staff.map((member) => (
          <div key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0891B2] text-base font-extrabold flex items-center justify-center shrink-0">
                {member.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {member.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{member.role}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                  <span className="flex items-center gap-1 text-slate-600"><Mail size={13} /> {member.email}</span>
                  <span className="flex items-center gap-1 text-slate-600"><Phone size={13} /> {member.phone}</span>
                  <span className="flex items-center gap-1 text-slate-500"><Clock size={13} /> {member.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
                {member.permissions}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
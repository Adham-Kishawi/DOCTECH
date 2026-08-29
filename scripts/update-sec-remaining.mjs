import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\secretary";

// ============================================
// 7. SECRETARY REPORTS TRIAGE INBOX
// ============================================
const secReports = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Search, AlertCircle, Clock, ChevronRight, Stethoscope, MessageCircle } from "lucide-react";

interface Report {
  id: string;
  patientName: string;
  phone: string;
  summary: string;
  urgency: "High" | "Medium" | "Normal";
  triageStatus: "pending_triage" | "sent_to_doctor" | "doctor_replied" | "dispatched";
  time: string;
}

const reportsList: Report[] = [
  { id: "REP-401", patientName: "Kareem Tarek", phone: "+20 100 123 4567", summary: "High fever 39.2C with chills post antibiotic course.", urgency: "High", triageStatus: "sent_to_doctor", time: "15 mins ago" },
  { id: "REP-402", patientName: "Nouran Mahmoud", phone: "+20 102 345 6789", summary: "Glucose lab test result image received via WhatsApp.", urgency: "Normal", triageStatus: "pending_triage", time: "1 hour ago" },
  { id: "REP-403", patientName: "Hany Youssef", phone: "+20 103 456 7890", summary: "Mild rash on forearm after 2nd dose.", urgency: "Medium", triageStatus: "sent_to_doctor", time: "3 hours ago" },
  { id: "REP-404", patientName: "Mariam Khaled", phone: "+20 104 567 8901", summary: "Vitamin dosage clarification inquiry.", urgency: "Normal", triageStatus: "doctor_replied", time: "Yesterday" },
];

export default function SecretaryReportsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = reportsList.filter((r) => {
    const matchesFilter = filter === "all" || r.triageStatus === filter;
    const matchesSearch = r.patientName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
            <AlertCircle size={13} />
            {isRTL ? "فرز وتصنيف استفسارات وتقارير المرضى" : "Reports Triage & Intake Dispatch"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "صندوق فرز التقارير" : "Reports Triage Desk"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "فرز رسائل المرضى، تصنيف درجة الاستعجال، وإرسالها للطبيب للمراجعة"
              : "Review incoming patient inquiries, assign triage urgency, and route to doctor"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في التقارير..." : "Search patient or Report ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "pending_triage", "sent_to_doctor", "doctor_replied"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize \${
                filter === tab
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }\`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((rep) => (
          <Link
            key={rep.id}
            href={\`/\${locale}/secretary/reports/\${rep.id}\`}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div
                className={\`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border \${
                  rep.urgency === "High"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : rep.urgency === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-cyan-50 text-[#0891B2] border-cyan-200"
                }\`}
              >
                <FileText size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors">
                    {rep.patientName}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-bold">({rep.id})</span>
                  <span
                    className={\`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase \${
                      rep.urgency === "High"
                        ? "bg-red-100 text-red-700"
                        : rep.urgency === "Medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }\`}
                  >
                    {rep.urgency}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">{rep.summary}</p>
                <p className="text-[11px] text-slate-400 mt-1">Status: {rep.triageStatus.replace("_", " ")} • {rep.time}</p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#0891B2] group-hover:underline flex items-center gap-1 self-end sm:self-center">
              {isRTL ? "فتح الفرز والتوجيه" : "Open Triage & Route"}
              <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}`;

// ============================================
// 8. SECRETARY REPORT TRIAGE & DISPATCH DETAIL [id]
// ============================================
const secReportDetail = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowLeft, Send, Stethoscope, AlertTriangle, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SecretaryReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "REP-401";

  const [triageNote, setTriageNote] = useState("Patient reports fever of 39.2C post antibiotic. Flagged for urgent doctor review.");
  const [urgency, setUrgency] = useState<"High" | "Medium" | "Normal">("High");
  const [sending, setSending] = useState(false);

  const handleSendToDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    setTimeout(() => {
      toast.success(isRTL ? "تم إرسال التقرير وتنبيه الطبيب فوراً!" : "Report triaged & routed to Dr. Clinical Lead!");
      router.push(\`/\${locale}/secretary/reports\`);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href={\`/\${locale}/secretary/reports\`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى صندوق الفرز" : "Back to Reports Triage"}</span>
      </Link>

      <div className="doctech-card p-7 sm:p-9 bg-white space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Case Triage & Doctor Dispatch #{id}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Assign urgency and send clinical summary to Doctor</p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
            {id}
          </span>
        </div>

        {/* Patient Inquiry Review */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Patient: Kareem Tarek (+20 100 123 4567)</span>
            <span className="text-slate-400">15 mins ago</span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            &quot;I have had high fever (39.2C) with chills for 3 consecutive days after finishing the prescribed antibiotic course.&quot;
          </p>
        </div>

        <form onSubmit={handleSendToDoctor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Urgency Level</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["High", "Medium", "Normal"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgency(lvl)}
                  className={\`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer \${
                    urgency === lvl
                      ? lvl === "High"
                        ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-500/20"
                        : lvl === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }\`}
                >
                  {lvl} Urgency
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Secretary Intake & Triage Notes</label>
            <textarea
              rows={3}
              required
              value={triageNote}
              onChange={(e) => setTriageNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full h-11 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-bold shadow-md shadow-cyan-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{sending ? "Routing to Doctor..." : "Route Case to Dr. Clinical Lead"}</span>
            <Stethoscope size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}`;

// ============================================
// 9. SECRETARY SCHEDULE MANAGEMENT
// ============================================
const secSchedule = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock, Plus, User, Stethoscope } from "lucide-react";

export default function SecretarySchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedDay, setSelectedDay] = useState("Sunday");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <Calendar size={13} />
            {isRTL ? "إدارة جدول كشوفات العيادة" : "Clinic Master Schedule"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "جدول الحجوزات والمواعيد" : "Master Schedule Desk"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة وتخصيص الفترات الشاغرة وحجز المرضى"
              : "Organize doctor consultation hours, book slots, and avoid double booking"}
          </p>
        </div>

        <Link
          href={\`/\${locale}/secretary/appointments/new\`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all"
        >
          <Plus size={15} />
          <span>{isRTL ? "حجز كشف جديد" : "Book New Slot"}</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center transition-all cursor-pointer \${
                selectedDay === day
                  ? "bg-[#0891B2] text-white font-bold shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
              }\`}
            >
              <p className="text-xs">{day}</p>
              <p className="text-[10px] opacity-80 mt-0.5">6 Booked • 4 Free</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}`;

// ============================================
// 10. SECRETARY INTERNAL CHAT WITH DOCTOR
// ============================================
const secComms = `"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";

export default function SecretaryCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [messages, setMessages] = useState([
    { id: "1", sender: "secretary", text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.", time: "09:15 AM" },
    { id: "2", sender: "doctor", text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.", time: "09:18 AM" },
    { id: "3", sender: "secretary", text: "CBC report is uploaded and attached to his case file.", time: "09:20 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      { id: Date.now().toString(), sender: "secretary", text: inputText.trim(), time: "Just now" },
    ]);
    setInputText("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0891B2] text-white flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Doctor Communications Line</h1>
            <p className="text-xs text-slate-500 font-medium">Direct line with Dr. Clinical Lead</p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Doctor Online" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[500px] overflow-hidden">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
          {messages.map((m) => {
            const isSecretary = m.sender === "secretary";
            return (
              <div
                key={m.id}
                className={\`flex flex-col \${isSecretary ? "items-end" : "items-start"}\`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
                  <span>{isSecretary ? "You (Sarah Jenkins)" : "Dr. Clinical Lead"}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div
                  className={\`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs \${
                    isSecretary
                      ? "bg-[#0891B2] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }\`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة إلى الطبيب..." : "Type urgent message or query to Doctor..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}`;

// ============================================
// 11. SECRETARY NOTIFICATIONS
// ============================================
const secNotifications = `"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bell, CalendarCheck, MessageCircle, FileText, Check } from "lucide-react";

export default function SecretaryNotificationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [items, setItems] = useState([
    { id: "1", title: "Doctor Reviewed Treatment Plan", desc: "Dr. Clinical Lead submitted decision for Patient Kareem Tarek. Ready to dispatch via WhatsApp.", time: "5 mins ago", icon: FileText, unread: true, color: "text-emerald-600 bg-emerald-50" },
    { id: "2", title: "New WhatsApp Inquiry", desc: "Nouran Mahmoud asked for glucose report review.", time: "45 mins ago", icon: MessageCircle, unread: true, color: "text-cyan-600 bg-cyan-50" },
    { id: "3", title: "Appointment Scheduled", desc: "Ahmed Hassan consultation confirmed for 09:00 AM.", time: "2 hours ago", icon: CalendarCheck, unread: false, color: "text-blue-600 bg-blue-50" },
  ]);

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, unread: false })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <Bell size={13} />
            {isRTL ? "مركز تنبيهات الاستقبال" : "Reception Operational Feed"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة قرارات الطبيب ورسائل الواتساب الواردة وحجوزات المواعيد"
              : "Live activity regarding doctor decisions, patient WhatsApp queries, and appointments"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0891B2] bg-cyan-50 hover:bg-cyan-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Check size={14} />
          <span>{isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={\`p-5 flex items-start gap-4 transition-colors \${
                item.unread ? "bg-cyan-50/25" : "hover:bg-slate-50"
              }\`}
            >
              <div className={\`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 \${item.color}\`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(base, "reports", "page.tsx"), secReports, "utf8");
fs.writeFileSync(path.join(base, "reports", "[id]", "page.tsx"), secReportDetail, "utf8");
fs.writeFileSync(path.join(base, "schedule", "page.tsx"), secSchedule, "utf8");
fs.writeFileSync(path.join(base, "communications", "page.tsx"), secComms, "utf8");
fs.writeFileSync(path.join(base, "notifications", "page.tsx"), secNotifications, "utf8");

console.log("All remaining Secretary screens successfully built");

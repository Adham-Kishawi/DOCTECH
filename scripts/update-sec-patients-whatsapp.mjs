import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\secretary";

// ============================================
// 3. PATIENTS DIRECTORY
// ============================================
const patientsList = `"use client";

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
            {isRTL ? \`إجمالي المرضى: \${patientsData.length}\` : \`Total Patients: \${patientsData.length}\`}
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
            href={\`/\${locale}/secretary/patients/\${patient.id}\`}
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
}`;

// ============================================
// 4. PATIENT PROFILE DETAIL
// ============================================
const patientProfile = `"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Phone, CalendarCheck, MessageCircle, FileText, Clock, Plus } from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "PAT-001";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href={\`/\${locale}/secretary/patients\`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى دليل المرضى" : "Back to Patient Directory"}</span>
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-[#0891B2] text-xl font-extrabold flex items-center justify-center shrink-0 border border-cyan-100">
            AH
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">Ahmed Hassan</h1>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3">
              <span>+20 100 123 4567</span>
              <span>•</span>
              <span>42 Years (Male)</span>
              <span>•</span>
              <span>Blood Group: A+</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={\`/\${locale}/secretary/whatsapp/1\`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Chat</span>
          </Link>
          <Link
            href={\`/\${locale}/secretary/appointments/new\`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Book Visit</span>
          </Link>
        </div>
      </div>

      {/* Medical History & Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
            Medical Background
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Chronic Conditions</span>
              <p className="font-bold text-slate-800 mt-0.5">Hypertension (Diagnosed 2021)</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Known Allergies</span>
              <p className="font-bold text-slate-800 mt-0.5">Penicillin (Mild urticaria)</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Current Prescriptions</span>
              <p className="font-bold text-slate-800 mt-0.5">Amlodipine 5mg OD, Concor 2.5mg</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Consultation History (Past Visits)</h2>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Follow-up Check • Dr. Clinical Lead</span>
                <p className="text-xs text-slate-500 mt-0.5">Blood pressure measured 135/85 mmHg. Prescription continued.</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Today</span>
            </div>
            <div className="py-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Initial Cardiology Evaluation</span>
                <p className="text-xs text-slate-500 mt-0.5">ECG performed normal sinus rhythm. Advised lifestyle modifications.</p>
              </div>
              <span className="text-xs font-mono text-slate-400">2 months ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;

// ============================================
// 5. SECRETARY WHATSAPP CONVERSATIONS
// ============================================
const secWhatsapp = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, Search, Clock, CheckCheck, User, ArrowRight } from "lucide-react";

interface Conversation {
  id: string;
  patientName: string;
  phone: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const chats: Conversation[] = [
  { id: "1", patientName: "Ahmed Hassan", phone: "+20 100 123 4567", lastMessage: "Thank you Sarah, see you tomorrow at 09:00 AM.", time: "10:15 AM", unreadCount: 0 },
  { id: "2", patientName: "Nouran Mahmoud", phone: "+20 102 345 6789", lastMessage: "Here is the glucose lab test image as requested.", time: "09:45 AM", unreadCount: 2 },
  { id: "3", patientName: "Kareem Tarek", phone: "+20 105 678 9012", lastMessage: "Did the doctor review my fever inquiry?", time: "08:30 AM", unreadCount: 1 },
  { id: "4", patientName: "Sara Ibrahim", phone: "+20 103 456 7890", lastMessage: "Can I reschedule my appointment to Thursday?", time: "Yesterday", unreadCount: 0 },
];

export default function SecretaryWhatsAppPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");

  const filtered = chats.filter(
    (c) => c.patientName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
            <MessageCircle size={13} />
            {isRTL ? "محادثات الواتساب الرسمية للعيادة" : "WhatsApp Business Cloud Integration"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "محادثات الواتساب" : "WhatsApp Inquiries"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "التواصل المباشر مع المرضى، تأكيد المواعيد، واستقبال التقارير"
              : "Live patient chat inbox powered by Meta WhatsApp Business API"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            WhatsApp API: Connected
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في المحادثات..." : "Search conversations..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((chat) => (
          <Link
            key={chat.id}
            href={\`/\${locale}/secretary/whatsapp/\${chat.id}\`}
            className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 border border-emerald-100">
                <MessageCircle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {chat.patientName}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{chat.phone}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
                  {chat.lastMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">{chat.time}</span>
              {chat.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
              <ArrowRight size={15} className={\`text-slate-300 group-hover:text-emerald-600 \${isRTL ? "rotate-180" : ""}\`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`;

// ============================================
// 6. WHATSAPP CHAT ROOM DETAIL [id]
// ============================================
const secWhatsappChat = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, ArrowLeft, Send, Paperclip, CheckCheck, User, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  from: "patient" | "clinic";
  text: string;
  time: string;
}

export default function SecretaryWhatsAppChatRoomPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "1";

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "clinic", text: "Hello Ahmed! This is Al-Amal Clinic reminding you of your consultation tomorrow at 09:00 AM with Dr. Clinical Lead.", time: "10:00 AM" },
    { id: "2", from: "patient", text: "Thank you Sarah! I confirm my attendance. Should I come fasting?", time: "10:10 AM" },
    { id: "3", from: "clinic", text: "Yes please, fasting for 8 hours for routine blood work.", time: "10:12 AM" },
    { id: "4", from: "patient", text: "Understood, see you tomorrow at 09:00 AM.", time: "10:15 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        from: "clinic",
        text: inputText.trim(),
        time: "Just now",
      },
    ]);
    setInputText("");
    toast.success("WhatsApp message delivered!");
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href={\`/\${locale}/secretary/whatsapp\`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى محادثات الواتساب" : "Back to WhatsApp Inbox"}</span>
      </Link>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold text-sm flex items-center justify-center border border-emerald-100">
            AH
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Ahmed Hassan</h1>
            <p className="text-xs text-slate-500 font-medium">+20 100 123 4567 • Patient #{id}</p>
          </div>
        </div>

        <Link
          href={\`/\${locale}/secretary/appointments/new\`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 text-[#0891B2] text-xs font-bold hover:bg-cyan-100 transition-colors"
        >
          <Calendar size={13} />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Chat Thread */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
          {messages.map((msg) => {
            const isClinic = msg.from === "clinic";
            return (
              <div
                key={msg.id}
                className={\`flex flex-col \${isClinic ? "items-end" : "items-start"}\`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
                  <span>{isClinic ? "Al-Amal Clinic (You)" : "Ahmed Hassan"}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={\`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs \${
                    isClinic
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }\`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة واتساب..." : "Type WhatsApp reply..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(base, "patients", "page.tsx"), patientsList, "utf8");
fs.writeFileSync(path.join(base, "patients", "[id]", "page.tsx"), patientProfile, "utf8");
fs.writeFileSync(path.join(base, "whatsapp", "page.tsx"), secWhatsapp, "utf8");
fs.writeFileSync(path.join(base, "whatsapp", "[id]", "page.tsx"), secWhatsappChat, "utf8");

console.log("secretary/patients & whatsapp screens successfully built");

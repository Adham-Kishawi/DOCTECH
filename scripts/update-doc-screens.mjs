import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\doctor";

// ============================================
// 4. DOCTOR MEDICAL REVIEW HUB [id]
// ============================================
const medicalReview = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, ArrowLeft, Send, Sparkles, CheckCircle2, 
  AlertTriangle, User, MessageCircle, Stethoscope, Clock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorMedicalReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "REP-401";

  const [diagnosis, setDiagnosis] = useState("Suspected drug resistance / persistent bacterial infection. Discontinue current formulation.");
  const [prescription, setPrescription] = useState("1. Ceftriaxone 1g IM daily for 3 days.\\n2. Paracetamol 500mg every 8 hours as needed for fever.\\n3. Maintain high fluid intake.");
  const [instructions, setInstructions] = useState("Return to clinic immediately if temperature exceeds 39.5C or difficulty breathing occurs.");
  const [replyMethod, setReplyMethod] = useState<"whatsapp" | "ai" | "clinic">("whatsapp");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      toast.success(isRTL ? "تم حفظ القرار الطبي وإرسال التوجيه إلى السكرتيرة والواتساب" : "Medical review submitted & dispatched to WhatsApp/Secretary!");
      router.push(\`/\${locale}/doctor/reports\`);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={\`/\${locale}/doctor/reports\`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة إلى قائمة التقارير" : "Back to Reports Inbox"}</span>
        </Link>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
          Case #{id}
        </span>
      </div>

      {/* Main Grid: Patient Case Summary + Doctor Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Symptoms & Secretary Triage */}
        <div className="space-y-5">
          {/* Patient Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] text-base font-extrabold flex items-center justify-center shrink-0">
                KT
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Kareem Tarek</h2>
                <p className="text-xs text-slate-500 font-medium">+20 100 123 4567 • 46 yrs (Male)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient Inquiry</span>
                <p className="font-medium text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  &quot;I have had high fever (39.2C) with chills for 3 consecutive days after finishing the prescribed antibiotic course.&quot;
                </p>
              </div>

              <div>
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-600" />
                  Secretary Triage Notes (Sarah J.)
                </span>
                <p className="font-medium text-amber-900 mt-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
                  &quot;Patient states fever is not breaking. Marked as HIGH urgency. Awaiting Dr. decision before WhatsApp response.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Medical Decision & Prescription Editor */}
        <div className="lg:col-span-2 bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Clinical Review & Treatment Plan</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Provide medical diagnosis, updated dosage, and patient instructions
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1A4B8C] text-xs font-bold border border-blue-100">
              <Stethoscope size={14} />
              <span>Medical Lead</span>
            </div>
          </div>

          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Clinical Diagnosis / Impression
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="doctech-input !pl-4 !pr-4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Prescription & Medication Plan
              </label>
              <textarea
                rows={4}
                required
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Special Patient Instructions / Red Flags
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>

            {/* Reply Dispatch Method */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {isRTL ? "طريقة إرسال الرد للمريض:" : "Dispatch Method to Patient:"}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyMethod("whatsapp")}
                  className={\`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer \${
                    replyMethod === "whatsapp"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }\`}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Business API</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplyMethod("ai")}
                  className={\`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer \${
                    replyMethod === "ai"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }\`}
                >
                  <Sparkles size={15} />
                  <span>AI Patient Summary</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{submitting ? "Submitting Decision..." : "Approve & Dispatch Treatment Plan"}</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}`;

// ============================================
// 5. DOCTOR TEAM MANAGEMENT
// ============================================
const teamManagement = `"use client";

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
          href={\`/\${locale}/doctor/team/invite\`}
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
}`;

// ============================================
// 6. INVITE SECRETARY FORM
// ============================================
const inviteSecretary = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Mail, User, ShieldCheck, Send } from "lucide-react";
import { toast } from "sonner";

export default function InviteSecretaryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Secretary",
    permissions: "Full Access (Appointments + WhatsApp)",
  });
  const [loading, setLoading] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success(isRTL ? "تم إرسال رابط التفعيل إلى بريد السكرتيرة بنجاح!" : "Invitation & activation link sent to secretary email!");
      router.push(\`/\${locale}/doctor/team\`);
    }, 400);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href={\`/\${locale}/doctor/team\`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى الفريق" : "Back to Staff Directory"}</span>
      </Link>

      <div className="doctech-card p-7 sm:p-9 bg-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRTL ? "دعوة سكرتيرة جديدة" : "Invite Clinic Secretary"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isRTL
              ? "أدخل بريد السكرتيرة لإرسال رابط تفعيل الحساب والصلاحيات"
              : "Send an invitation link for your reception coordinator to join DOCTECH"}
          </p>
        </div>

        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "الاسم الكامل" : "Full Secretary Name"}
            </label>
            <div className="relative">
              <User className="doctech-input-icon" size={17} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sarah Jenkins"
                className="doctech-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "البريد الإلكتروني المهني" : "Secretary Email Address"}
            </label>
            <div className="relative">
              <Mail className="doctech-input-icon" size={17} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="secretary@clinic.com"
                className="doctech-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "الصلاحيات الممنوحة" : "Assigned Permissions"}
            </label>
            <select
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            >
              <option value="Full Access (Appointments + WhatsApp)">Full Access (Appointments + WhatsApp + Reports Triage)</option>
              <option value="Appointments Only">Appointments & Patient Directory Only</option>
              <option value="Front Desk Booking Only">Front Desk Booking Only</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{loading ? "Sending Invitation..." : "Send Invitation Link"}</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}`;

// ============================================
// 7. INTERNAL COMMUNICATIONS (Doctor-Secretary Chat)
// ============================================
const communications = `"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send, Paperclip, CheckCheck, User, Stethoscope } from "lucide-react";

interface Message {
  id: string;
  sender: "doctor" | "secretary";
  text: string;
  time: string;
}

export default function DoctorCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "secretary", text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.", time: "09:15 AM" },
    { id: "2", sender: "doctor", text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.", time: "09:18 AM" },
    { id: "3", sender: "secretary", text: "CBC report is uploaded and attached to his case file.", time: "09:20 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: "doctor",
        text: inputText.trim(),
        time: "Just now",
      },
    ]);
    setInputText("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A4B8C] text-white flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Internal Clinic Channel</h1>
            <p className="text-xs text-slate-500 font-medium">Direct line with Reception (Sarah Jenkins)</p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[500px] overflow-hidden">
        {/* Messages Thread */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/40">
          {messages.map((m) => {
            const isDoctor = m.sender === "doctor";
            return (
              <div
                key={m.id}
                className={\`flex flex-col \${isDoctor ? "items-end" : "items-start"}\`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>{isDoctor ? "You (Dr. Clinical Lead)" : "Sarah Jenkins (Secretary)"}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div
                  className={\`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs \${
                    isDoctor
                      ? "bg-[#1A4B8C] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }\`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة إلى السكرتيرة..." : "Type instructions or reply to reception..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
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
// 8. NOTIFICATIONS HUB
// ============================================
const notifications = `"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bell, CalendarCheck, FileText, MessageCircle, ShieldCheck, Check } from "lucide-react";

export default function DoctorNotificationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [items, setItems] = useState([
    { id: "1", title: "Urgent Patient Report Triaged", desc: "Patient Kareem Tarek submitted a high fever report requiring review.", time: "15 mins ago", icon: FileText, unread: true, color: "text-red-600 bg-red-50" },
    { id: "2", title: "New Appointment Booked", desc: "Secretary booked follow-up consultation for Ahmed Hassan at 09:00 AM.", time: "1 hour ago", icon: CalendarCheck, unread: true, color: "text-blue-600 bg-blue-50" },
    { id: "3", title: "WhatsApp Message Received", desc: "Nouran Mahmoud sent lab report image via clinic WhatsApp number.", time: "2 hours ago", icon: MessageCircle, unread: false, color: "text-emerald-600 bg-emerald-50" },
    { id: "4", title: "System Security Health Check", desc: "All patient database records backed up and encrypted successfully.", time: "Yesterday", icon: ShieldCheck, unread: false, color: "text-slate-600 bg-slate-100" },
  ]);

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, unread: false })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <Bell size={13} />
            {isRTL ? "مركز التنبيهات السريرية" : "Clinical Activity & Notification Feed"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة التحديثات اللحظية للمرضى والمواعيد والتقارير"
              : "Live updates regarding incoming cases, triage alerts, and reception activities"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A4B8C] bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
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
                item.unread ? "bg-blue-50/25" : "hover:bg-slate-50"
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

// Write remaining Doctor files
fs.writeFileSync(path.join(base, "reports", "[id]", "page.tsx"), medicalReview, "utf8");
fs.writeFileSync(path.join(base, "team", "page.tsx"), teamManagement, "utf8");
fs.writeFileSync(path.join(base, "team", "invite", "page.tsx"), inviteSecretary, "utf8");
fs.writeFileSync(path.join(base, "communications", "page.tsx"), communications, "utf8");
fs.writeFileSync(path.join(base, "notifications", "page.tsx"), notifications, "utf8");

console.log("All remaining Doctor screens written with rich UI");

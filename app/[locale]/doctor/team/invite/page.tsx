"use client";

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
      router.push(`/${locale}/doctor/team`);
    }, 400);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href={`/${locale}/doctor/team`}
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
}
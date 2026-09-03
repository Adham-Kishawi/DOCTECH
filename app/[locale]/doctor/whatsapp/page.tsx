"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle, Plug, RefreshCw, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  Loader2, Bot, Sparkles, Copy, Check, Pencil, Phone, Globe, Zap,
  ArrowUpRight, Settings2, ChevronRight, Info, Save, Clock, MapPin,
  Stethoscope, DollarSign, FileText, Building2,
} from "lucide-react";
import {
  getStoredPhone, setStoredPhone, buildConfig, formatEgyptianPhone, DEFAULT_RAW,
} from "@/lib/whatsapp/config";
import {
  getClinicContext, setClinicContext, buildClinicContextPrompt,
  type ClinicContextData, DEFAULT_CLINIC_CONTEXT,
} from "@/lib/whatsapp/clinicContext";
import { toast } from "sonner";

/* ─── Types ─── */
interface ConfigStatus {
  configured: boolean;
  phoneNumberIdMasked?: string | null;
  accessTokenSet?: boolean;
  webhookVerifyTokenSet?: boolean;
}
interface TestResult {
  verified: boolean;
  info?: { display_phone_number: string; verified_name: string; quality_rating: string; code_verification_status: string } | null;
  error?: string;
}
interface SimResult {
  replyText: string;
  intent: string;
  extractedDetails?: { patientName?: string; preferredDate?: string; preferredTime?: string; symptoms?: string };
  createdBookingRequest?: boolean;
}

/* ─── Page ─── */
export default function DoctorWhatsAppPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  /* ── Clinic Number ── */
  const [phoneRaw, setPhoneRaw] = useState(DEFAULT_RAW);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPhoneRaw(getStoredPhone()); }, []);
  const phoneFmt = formatEgyptianPhone(phoneRaw);

  const beginEditPhone = () => {
    setEditPhoneValue(phoneRaw);
    setIsEditingPhone(true);
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  };
  const savePhone = () => {
    const cleaned = editPhoneValue.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) {
      toast.error(isRTL ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }
    setStoredPhone(cleaned);
    setPhoneRaw(cleaned);
    setIsEditingPhone(false);
    toast.success(isRTL ? "تم حفظ الرقم الجديد ✓" : "Phone number updated ✓");
  };
  const cancelEditPhone = () => { setIsEditingPhone(false); setEditPhoneValue(phoneRaw); };

  /* ── Clinic Context Data ── */
  const [clinicData, setClinicData] = useState<ClinicContextData>(DEFAULT_CLINIC_CONTEXT);
  const [showClinicSection, setShowClinicSection] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);

  useEffect(() => { setClinicData(getClinicContext()); }, []);

  const updateClinicField = (field: keyof ClinicContextData, value: string) => {
    setClinicData((prev) => ({ ...prev, [field]: value }));
  };
  const handleSaveClinicData = () => {
    setSavingClinic(true);
    setClinicContext(clinicData);
    setTimeout(() => {
      setSavingClinic(false);
      toast.success(isRTL ? "تم حفظ بيانات العيادة ✓" : "Clinic data saved ✓");
    }, 300);
  };

  /* ── Meta API Status ── */
  const [apiStatus, setApiStatus] = useState<ConfigStatus | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showApiSection, setShowApiSection] = useState(false);

  const fetchApiStatus = useCallback(async () => {
    setLoadingApi(true);
    try { const r = await fetch("/api/whatsapp/config"); const j = await r.json(); if (j.success) setApiStatus(j); }
    catch { setApiStatus(null); }
    finally { setLoadingApi(false); }
  }, []);
  useEffect(() => { fetchApiStatus(); }, [fetchApiStatus]);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault(); setTesting(true); setTestResult(null);
    try {
      const r = await fetch("/api/whatsapp/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId, accessToken }),
      });
      const j = await r.json();
      setTestResult({ verified: j.verified, info: j.info, error: j.error });
      await fetchApiStatus();
    } catch { setTestResult({ verified: false, error: "Network error." }); }
    finally { setTesting(false); }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`);
    setCopiedWebhook(true);
    toast.success(isRTL ? "تم نسخ الرابط" : "Copied!");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  /* ── AI Simulator ── */
  const [simMsg, setSimMsg] = useState("مساء الخير عايز احجز كشف بكرة ضروري عندي سخونية مستمرة");
  const [simName, setSimName] = useState("أحمد مصطفى");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMsg.trim()) return;
    setSimulating(true); setSimResult(null);
    try {
      const cfg = buildConfig(phoneRaw);
      const contextPrompt = buildClinicContextPrompt(clinicData);
      const r = await fetch("/api/whatsapp/simulate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPhone: cfg.international,
          patientName: simName.trim() || "مريض",
          messageText: simMsg.trim(),
          clinicContextPrompt: contextPrompt || undefined,
        }),
      });
      const d = await r.json();
      if (d.success) { setSimResult(d.result); toast.success(isRTL ? "تم الرد بنجاح!" : "Reply generated!"); }
      else toast.error(d.error || "Failed");
    } catch { toast.error("Simulation failed"); }
    finally { setSimulating(false); }
  };

  /* ─── RENDER ─── */
  const cfg = buildConfig(phoneRaw);

  const clinicFields: { key: keyof ClinicContextData; label: string; labelAr: string; icon: React.ReactNode; placeholder: string; placeholderAr: string; wide?: boolean }[] = [
    { key: "clinicName", label: "Clinic Name", labelAr: "اسم العيادة", icon: <Building2 size={14} />, placeholder: "e.g. DocTech Clinic", placeholderAr: "مثال: عيادة دوك تك" },
    { key: "doctorName", label: "Doctor Name", labelAr: "اسم الطبيب", icon: <Stethoscope size={14} />, placeholder: "e.g. Dr. Ahmed Hossam", placeholderAr: "مثال: د. أحمد حسام" },
    { key: "specialty", label: "Specialty", labelAr: "التخصص", icon: <FileText size={14} />, placeholder: "e.g. Cardiology", placeholderAr: "مثال: قلب وأوعية دموية" },
    { key: "address", label: "Address", labelAr: "العنوان", icon: <MapPin size={14} />, placeholder: "e.g. 5 Nile St, Maadi, Cairo", placeholderAr: "مثال: 5 شارع النيل، المعادي", wide: true },
    { key: "workingDays", label: "Working Days", labelAr: "أيام العمل", icon: <Clock size={14} />, placeholder: "Sat - Thu", placeholderAr: "السبت - الخميس" },
    { key: "workingHours", label: "Working Hours", labelAr: "مواعيد العمل", icon: <Clock size={14} />, placeholder: "10:00 AM - 6:00 PM", placeholderAr: "10:00 ص - 06:00 م" },
    { key: "consultationFee", label: "Consultation Fee (EGP)", labelAr: "سعر الكشف (جنيه)", icon: <DollarSign size={14} />, placeholder: "400", placeholderAr: "400" },
    { key: "followUpFee", label: "Follow-up Fee (EGP)", labelAr: "سعر المتابعة (جنيه)", icon: <DollarSign size={14} />, placeholder: "200", placeholderAr: "200" },
    { key: "services", label: "Services", labelAr: "الخدمات المتاحة", icon: <Stethoscope size={14} />, placeholder: "e.g. ECG, Echo, Blood tests", placeholderAr: "مثال: رسم قلب، أشعة، تحاليل", wide: true },
    { key: "additionalNotes", label: "Additional Notes for AI", labelAr: "ملاحظات إضافية للمساعد الذكي", icon: <FileText size={14} />, placeholder: "Any extra info the assistant should know...", placeholderAr: "أي معلومات إضافية المساعد الذكي يحتاج يعرفها...", wide: true },
  ];

  return (
    <div className="space-y-6 max-w-[860px] mx-auto pb-16">

      {/* ━━━ PAGE TITLE ━━━ */}
      <div>
        <h1 className="text-[22px] font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isRTL ? "واتساب العيادة" : "WhatsApp"}
        </h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {isRTL
            ? "إدارة رقم العيادة، بيانات العيادة، والمساعد الذكي"
            : "Manage your clinic number, data, and smart assistant"}
        </p>
      </div>

      {/* ━━━ 1. PHONE NUMBER CARD ━━━ */}
      <div className="rounded-[20px] overflow-hidden shadow-lg shadow-emerald-900/10 dark:shadow-black/30">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        <div className="bg-white dark:bg-[#131E2E] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: phone */}
            <div className="space-y-2.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isRTL ? "رقم واتساب العيادة" : "Clinic WhatsApp Number"}
                </p>
              </div>

              {isEditingPhone ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={editPhoneValue}
                    onChange={(e) => setEditPhoneValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") savePhone(); if (e.key === "Escape") cancelEditPhone(); }}
                    placeholder="01XXXXXXXXX"
                    className="h-11 px-3.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-lg font-bold font-mono text-slate-900 dark:text-white tracking-wider outline-none focus:border-emerald-500 transition-colors w-48"
                    dir="ltr"
                  />
                  <button onClick={savePhone} className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95">
                    <Check size={13} />
                    <span>{isRTL ? "حفظ" : "Save"}</span>
                  </button>
                  <button onClick={cancelEditPhone} className="h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer">
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-slate-900 dark:text-white leading-none" dir="ltr">
                    {phoneFmt.display}
                  </h2>
                  <button
                    onClick={beginEditPhone}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                    title={isRTL ? "تغيير الرقم" : "Change number"}
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed max-w-xs">
                {isRTL
                  ? "الرقم الذي يتلقى محادثات المرضى. يمكنك تغييره في أي وقت."
                  : "This number receives patient chats. You can change it anytime."}
              </p>
            </div>

            {/* Right: action buttons */}
            <div className="flex gap-2 shrink-0">
              <a
                href={cfg.waMeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97] shadow-md shadow-emerald-500/15"
              >
                <MessageCircle size={15} />
                <span className="hidden sm:inline">{isRTL ? "واتساب" : "WhatsApp"}</span>
                <ArrowUpRight size={12} className="opacity-70" />
              </a>
              <a
                href={`https://web.whatsapp.com/send?phone=${cfg.international}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97]"
              >
                <Globe size={14} />
                <span className="hidden sm:inline">{isRTL ? "ويب" : "Web"}</span>
                <ArrowUpRight size={12} className="opacity-40" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ 2. CLINIC DATA — Collapsible ━━━ */}
      <div className="rounded-[20px] bg-white dark:bg-[#131E2E] border border-slate-200/70 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowClinicSection(!showClinicSection)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <Building2 size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                {isRTL ? "بيانات العيادة" : "Clinic Information"}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {isRTL
                  ? "المواعيد، الأسعار، الخدمات — يستخدمها المساعد الذكي للرد على المرضى"
                  : "Hours, fees, services — used by the AI assistant to answer patients"}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${showClinicSection ? "rotate-90" : ""}`} />
        </button>

        {showClinicSection && (
          <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {clinicFields.map((f) => (
                <div key={f.key} className={f.wide ? "sm:col-span-2" : ""}>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    {f.icon}
                    {isRTL ? f.labelAr : f.label}
                  </label>
                  {f.key === "additionalNotes" || f.key === "services" ? (
                    <textarea
                      value={clinicData[f.key]}
                      onChange={(e) => updateClinicField(f.key, e.target.value)}
                      placeholder={isRTL ? f.placeholderAr : f.placeholder}
                      rows={2}
                      className="doctech-input !min-h-[56px] text-xs resize-none"
                      dir="auto"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clinicData[f.key]}
                      onChange={(e) => updateClinicField(f.key, e.target.value)}
                      placeholder={isRTL ? f.placeholderAr : f.placeholder}
                      className="doctech-input !h-9 text-xs"
                      dir="auto"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveClinicData}
              disabled={savingClinic}
              className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {savingClinic ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isRTL ? "حفظ بيانات العيادة" : "Save Clinic Data"}
            </button>
          </div>
        )}
      </div>

      {/* ━━━ 3. AI ASSISTANT SANDBOX ━━━ */}
      <div className="rounded-[20px] bg-white dark:bg-[#131E2E] border border-slate-200/70 dark:border-slate-800 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
            <Bot size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
              {isRTL ? "المساعد الذكي" : "Smart Assistant"}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {isRTL
                ? "اختبر كيف يرد المساعد على رسائل المرضى ويستخرج بيانات الحجز"
                : "Test how the assistant responds to patient messages and extracts bookings"}
            </p>
          </div>
        </div>

        {/* Simulator form — responsive */}
        <form onSubmit={handleSimulate} className="px-5 pb-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
            <input
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder={isRTL ? "اسم المريض" : "Patient name"}
              className="doctech-input !h-9 text-xs"
              dir="auto"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={simMsg}
                onChange={(e) => setSimMsg(e.target.value)}
                placeholder={isRTL ? "اكتب رسالة تجريبية من المريض..." : "Write a test message..."}
                className="doctech-input !h-9 text-xs flex-1 min-w-0"
                dir="auto"
              />
              <button
                type="submit"
                disabled={simulating || !simMsg.trim()}
                className="h-9 px-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
              >
                {simulating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>{isRTL ? "اختبار" : "Test"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* AI result */}
        {simResult && (
          <div className="mx-5 mb-5 rounded-xl bg-violet-50/50 dark:bg-violet-950/15 border border-violet-200/50 dark:border-violet-900/30 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                <Bot size={13} />
                {isRTL ? "رد المساعد الذكي:" : "Assistant reply:"}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-violet-200/70 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 uppercase tracking-wider">
                {simResult.intent}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-violet-100/80 dark:border-slate-800 text-[12px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-[1.7]" dir="auto">
              {simResult.replyText}
            </div>

            {simResult.extractedDetails && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                <span className="font-bold flex items-center gap-1"><Zap size={11} /> {isRTL ? "بيانات الحجز:" : "Booking:"}</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 font-medium">
                  📅 {simResult.extractedDetails.preferredDate} • {simResult.extractedDetails.preferredTime}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 font-medium">
                  👤 {simResult.extractedDetails.patientName}
                </span>
                {simResult.createdBookingRequest && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                    {isRTL ? "✓ تم إشعار الاستقبال" : "✓ Reception notified"}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ 4. META CLOUD API — Collapsible ━━━ */}
      <div className="rounded-[20px] bg-white dark:bg-[#131E2E] border border-slate-200/70 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowApiSection(!showApiSection)}
          className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <Settings2 size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                {isRTL ? "ربط Meta Cloud API" : "Meta Cloud API"}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {apiStatus?.configured
                  ? (isRTL ? "متصل ونشط ✓" : "Connected ✓")
                  : (isRTL ? "وضع المحاكاة — اختياري" : "Simulation mode — optional")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiStatus?.configured ? "bg-emerald-500" : "bg-amber-400"}`} />
            <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${showApiSection ? "rotate-90" : ""}`} />
          </div>
        </button>

        {showApiSection && (
          <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
            {/* Status chips */}
            <div className="grid grid-cols-3 gap-2 pt-3 text-[11px]">
              <div className={`p-3 rounded-xl border text-center ${apiStatus?.configured ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                {apiStatus?.configured ? <CheckCircle2 size={15} className="text-emerald-500 mx-auto mb-1" /> : <XCircle size={15} className="text-slate-300 mx-auto mb-1" />}
                <p className="font-bold text-slate-600 dark:text-slate-300">{isRTL ? "الحالة" : "Status"}</p>
                <p className="text-slate-400 mt-0.5">{apiStatus?.configured ? (isRTL ? "مفعّل" : "Active") : (isRTL ? "محاكاة" : "Sim")}</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${apiStatus?.phoneNumberIdMasked ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                <Phone size={15} className={`mx-auto mb-1 ${apiStatus?.phoneNumberIdMasked ? "text-emerald-500" : "text-slate-300"}`} />
                <p className="font-bold text-slate-600 dark:text-slate-300">Phone ID</p>
                <p className="text-slate-400 mt-0.5 font-mono truncate text-[10px]">{apiStatus?.phoneNumberIdMasked ?? "—"}</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${apiStatus?.webhookVerifyTokenSet ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                <ShieldCheck size={15} className={`mx-auto mb-1 ${apiStatus?.webhookVerifyTokenSet ? "text-emerald-500" : "text-slate-300"}`} />
                <p className="font-bold text-slate-600 dark:text-slate-300">Webhook</p>
                <p className="text-slate-400 mt-0.5">{apiStatus?.webhookVerifyTokenSet ? "✓" : "—"}</p>
              </div>
            </div>

            {/* Credentials */}
            <form onSubmit={handleTestConnection} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number ID</label>
                <input type="text" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="109876543210987" className="doctech-input !h-9 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {isRTL ? "رمز الدخول الدائم" : "Permanent Access Token"}
                </label>
                <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAG..." className="doctech-input !h-9 text-xs" />
              </div>
              <button
                type="submit"
                disabled={testing || !phoneNumberId || !accessToken}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40"
              >
                {testing ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
                {testing ? (isRTL ? "جاري التحقق..." : "Verifying...") : (isRTL ? "حفظ واختبار" : "Save & Verify")}
              </button>
            </form>

            {/* Test result */}
            {testResult && (
              <div className={`rounded-lg border p-3.5 text-xs ${testResult.verified ? "bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900" : "bg-red-50/50 dark:bg-red-950/15 border-red-200 dark:border-red-900"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {testResult.verified ? <ShieldCheck size={15} className="text-emerald-600" /> : <ShieldAlert size={15} className="text-red-600" />}
                  <span className={`font-bold ${testResult.verified ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {testResult.verified ? (isRTL ? "تم التحقق ✓" : "Verified ✓") : (isRTL ? "فشل التحقق" : "Failed")}
                  </span>
                </div>
                {testResult.verified && testResult.info ? (
                  <div className="flex gap-3 text-slate-500">
                    <span><strong>{isRTL ? "الاسم:" : "Name:"}</strong> {testResult.info.verified_name}</span>
                    <span><strong>{isRTL ? "الهاتف:" : "Phone:"}</strong> {testResult.info.display_phone_number}</span>
                  </div>
                ) : testResult.error ? (
                  <p className="text-red-600 dark:text-red-300">{testResult.error}</p>
                ) : null}
              </div>
            )}

            {/* Webhook */}
            <div className="pt-1 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info size={10} /> Webhook
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-slate-500 truncate">
                  /api/whatsapp/webhook
                </code>
                <button onClick={copyWebhookUrl} className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                  {copiedWebhook ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  {copiedWebhook ? "✓" : (isRTL ? "نسخ" : "Copy")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle, Plug, RefreshCw, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Loader2,
} from "lucide-react";

interface ConfigStatus {
  configured: boolean;
  phoneNumberIdMasked?: string | null;
  accessTokenSet?: boolean;
  webhookVerifyTokenSet?: boolean;
}

interface TestResult {
  verified: boolean;
  info?: { display_phone_number: string; verified_name: string; status: string; quality_rating: string; code_verification_status: string } | null;
  error?: string;
}

export default function DoctorWhatsAppSettingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/whatsapp/config");
      const json = await res.json();
      if (json.success) setStatus(json);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId, accessToken }),
      });
      const json = await res.json();
      setResult({ verified: json.verified, info: json.info, error: json.error });
      await fetchStatus();
    } catch {
      setResult({ verified: false, error: "Network error contacting the server." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
            <MessageCircle size={13} />
            {isRTL ? "اتصال واتساب حقيقي" : "WhatsApp Business API"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "إعدادات واتساب" : "WhatsApp Connection"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "اربط العيادة برقم واتساب حقيقي لإرسال واستقبال رسائل المرضى تلقائياً عبر Meta Cloud API"
              : "Connect your clinic to a real WhatsApp number to send & receive patient messages via Meta Cloud API"}
          </p>
        </div>
      </div>

      {/* Connection status card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {isRTL ? "حالة الاتصال من الخادم" : "Server Connection Status"}
            <RefreshCw
              size={14}
              className={`text-slate-400 cursor-pointer hover:text-[#1A4B8C] ${loadingStatus ? "animate-spin" : ""}`}
              onClick={() => !loadingStatus && fetchStatus()}
            />
          </h2>
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Loader2 size={15} className="animate-spin" />
            {isRTL ? "جاري التحقق..." : "Checking..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border flex items-start gap-2.5 ${status?.configured ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              {status?.configured ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-slate-700">{isRTL ? "الحالة" : "Configured"}</p>
                <p className="text-slate-500 mt-1 font-medium">
                  {status?.configured
                    ? isRTL ? "ممكّن عبر متغيرات الخادم" : "Active via env vars"
                    : isRTL ? "غير ممكّن بعد" : "Not configured yet"}
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border ${status?.phoneNumberIdMasked ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              <p className={`font-bold ${status?.phoneNumberIdMasked ? "text-emerald-700" : "text-slate-400"}`}>{isRTL ? "معرّف الرقم" : "Phone Number ID"}</p>
              <p className="text-slate-500 mt-1 font-medium font-mono">{status?.phoneNumberIdMasked ?? "—"}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${status?.webhookVerifyTokenSet ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              <p className={`font-bold ${status?.webhookVerifyTokenSet ? "text-emerald-700" : "text-slate-400"}`}>{isRTL ? "توتو الويب هوك" : "Webhook Token"}</p>
              <p className="text-slate-500 mt-1 font-medium">{status?.webhookVerifyTokenSet ? (isRTL ? "معيّن" : "Set") : "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Credentials form */}
      <form onSubmit={handleTest} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Plug size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{isRTL ? "مفاتيح الاتصال" : "Connection Keys"}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {isRTL
                ? "أدخل بيانات الحساب من Meta Developer (يتم اختبارها قبل الحفظ)"
                : "Enter credentials from Meta Developer (validated live before saving)"}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            WhatsApp Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="doctech-input"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "رمز الدخول (Access Token)" : "Permanent Access Token"}
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="EAAG..."
            className="doctech-input"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {isRTL
              ? "الرمز يُحفظ في ملف .env.local على الخادم فقط، ولا يُعرض مرة أخرى"
              : "Stored only in .env.local on your server; never displayed again after saving."}
          </p>
        </div>

        <button
          type="submit"
          disabled={testing || !phoneNumberId || !accessToken}
          className="inline-flex h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? <Loader2 size={16} className="animate-spin" /> : <Plug size={15} />}
          {testing
            ? (isRTL ? "جاري اختبار الاتصال..." : "Testing connection...")
            : (isRTL ? "اختبار الاتصال" : "Test Connection")}
        </button>
      </form>

      {/* Test result */}
      {result && (
        <div className={`rounded-2xl border shadow-xs p-5 ${result.verified ? "bg-emerald-50/60 border-emerald-200" : "bg-red-50/60 border-red-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.verified ? (
              <ShieldCheck size={18} className="text-emerald-700" />
            ) : (
              <ShieldAlert size={18} className="text-red-600" />
            )}
            <span className={`text-sm font-bold ${result.verified ? "text-emerald-800" : "text-red-700"}`}>
              {result.verified ? (isRTL ? "تم التحقق — الاتصال ناجح" : "Verified — Connected") : (isRTL ? "فشل الاتصال" : "Connection Failed")}
            </span>
          </div>

          {result.verified && result.info ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <p className="font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "اسم الطرف المتصل" : "Verified Name"}</p>
                <p className="font-bold text-slate-800 mt-0.5">{result.info.verified_name}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <p className="font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "رقم الهاتف" : "Display Phone"}</p>
                <p className="font-bold text-slate-800 mt-0.5">{result.info.display_phone_number}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <p className="font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "حالة الكود" : "Code Verification"}</p>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">{result.info.code_verification_status}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <p className="font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "جودة الرقم" : "Quality Rating"}</p>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">{result.info.quality_rating}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-red-700">{result.error}</p>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 space-y-1.5">
        <p className="font-bold">{isRTL ? "كيفية الحصول على البيانات (Meta Developers):" : "Where to get these (Meta for Developers):"}</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700 font-medium">
          <li>{isRTL ? "من Meta Developer → WhatsApp → API Setup → Phone Number ID و Access Token" : "Meta Developer → WhatsApp → API Setup → copy Phone Number ID & Access Token"}</li>
          <li>{isRTL ? "يجب إضافة أرقام المرضى إلى 'allowed recipients' أثناء التطوير" : "During development, add patient numbers to 'allowed recipients' first."}</li>
          <li>{isRTL ? "بعد الحفظ ستُستخدم القيم تلقائياً في شاشات التقارير والرد" : "After saving, these are used automatically by the reports & reply screens."}</li>
        </ul>
      </div>
    </div>
  );
}
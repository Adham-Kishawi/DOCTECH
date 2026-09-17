"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  User,
  Phone,
  Building2,
  Camera,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  KeyRound,
  BadgeCheck,
  Crop,
} from "lucide-react";
import { toast } from "sonner";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

interface Secretary {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  phone: string | null;
  permissions: string[];
  avatar_url: string | null;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  clinic_id: string;
}

interface Clinic {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url?: string | null;
}

interface ProfileResponse {
  success: boolean;
  user: Secretary;
  clinic: Clinic | null;
  error?: string;
}

export default function SecretaryProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [originalProfile, setOriginalProfile] = useState<ProfileResponse | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cropper Modal State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/secretary/profile", { cache: "no-store" });
        const data: ProfileResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load secretary profile");
        }

        setOriginalProfile(data);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setAvatarUrl(data.user.avatar_url || null);
      } catch (err: any) {
        console.error("Load secretary profile error:", err);
        setError("Failed to load secretary profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(isRTL ? "يرجى اختيار ملف صورة صالح" : "Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawImageToCrop(result);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    toast.success(
      isRTL
        ? "تم قص الصورة بنجاح! اضغط 'حفظ التعديلات' لحفظها في قاعدة البيانات."
        : "Photo cropped successfully! Click 'Save Changes' to apply."
    );
  };

  const handleReset = () => {
    if (!originalProfile) return;
    setName(originalProfile.user.name || "");
    setPhone(originalProfile.user.phone || "");
    setAvatarUrl(originalProfile.user.avatar_url || null);
    toast.info(isRTL ? "تمت استعادة البيانات الأصلية" : "Changes reverted to original values");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isRTL ? "الاسم مطلوب" : "Name is required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/secretary/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update secretary profile");
      }

      setOriginalProfile((prev) =>
        prev
          ? {
              ...prev,
              user: data.user,
            }
          : null
      );

      toast.success(
        isRTL
          ? "✨ تم حفظ التعديلات بنجاح في قاعدة البيانات!"
          : "✨ Secretary profile updated successfully in database!"
      );
    } catch (err: any) {
      console.error("Save secretary profile error:", err);
      toast.error(err.message || (isRTL ? "فشل حفظ التعديلات" : "Failed to save profile changes"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center px-4 py-12">
        <div className="w-full max-w-4xl min-h-[450px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#36ADA3] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-400">
            {isRTL ? "جاري تحميل بيانات السكرتارية..." : "Loading secretary profile..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !originalProfile) {
    return (
      <div className="w-full flex justify-center px-4 py-8">
        <div className="w-full max-w-4xl space-y-4">
          <h1 className="text-2xl font-black text-white">
            {isRTL ? "الملف الشخصي للسكرتير" : "Secretary Profile"}
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
            <p className="text-sm font-semibold text-red-400">
              {error || (isRTL ? "تعذر العثور على الملف الشخصي" : "Secretary profile not found")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const secretary = originalProfile.user;
  const clinic = originalProfile.clinic;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const hasChanges =
    name !== (secretary.name || "") ||
    phone !== (secretary.phone || "") ||
    avatarUrl !== (secretary.avatar_url || null);

  const statusLabel =
    secretary.status.charAt(0) + secretary.status.slice(1).toLowerCase();

  return (
    <div className="w-full flex justify-center px-2 sm:px-4 py-6">
      {/* Interactive Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageToCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
        isRTL={isRTL}
      />

      <div className="w-full max-w-4xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900 mb-2">
              <BadgeCheck size={13} className="text-teal-600 dark:text-teal-400" />
              <span>{isRTL ? "طاقم الاستقبال الطبي" : "Medical Reception Staff"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isRTL ? "الملف الشخصي للسكرتارية" : "Secretary Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "تخصيص صورتك الشخصية مع أداة القص المباشرة وبيانات التواصل"
                : "Customize your reception photo with interactive cropper and update contact information"}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{isRTL ? "إلغاء" : "Reset"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                saving
                  ? "bg-[#36ADA3]/70 cursor-not-allowed"
                  : "bg-[#36ADA3] hover:bg-teal-700 active:scale-98 shadow-teal-900/20"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{isRTL ? "جاري الحفظ..." : "Saving Changes..."}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isRTL ? "حفظ التعديلات" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. Avatar Customization Section with Real Cropper */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera size={18} className="text-[#36ADA3]" />
                <span>{isRTL ? "الصورة الشخصية" : "Profile Picture"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL
                  ? "صورتك تظهر للأطباء في المحادثات الداخلية وتنسيق الكشوفات"
                  : "Visible to doctors in staff comms and reception booking logs"}
              </p>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{isRTL ? "إزالة الصورة" : "Remove Photo"}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Live Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#36ADA3] to-teal-600 flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-black">{initials || "SC"}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1">Secretary</span>
                  </div>
                )}
              </div>

              {/* Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#36ADA3] text-white flex items-center justify-center shadow-lg hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
                title={isRTL ? "رفع وقص صورة جديدة" : "Upload & crop new picture"}
              >
                <Camera size={17} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Upload & Crop Instructions */}
            <div className="flex-1 text-center sm:text-left rtl:sm:text-right space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {avatarUrl
                    ? (isRTL ? "الصورة الشخصية معتمدة" : "Custom Photo Active")
                    : (isRTL ? "لم تقم برفع صورة شخصية بعد" : "No Custom Photo Uploaded")}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  {isRTL
                    ? "اختر أي صورة من جهازك، وسيقوم النظام بفتح أداة القص لتحديد الجزء الذي تريده وضبط الحجم بسهولة."
                    : "Select any image from your computer to pan, zoom, and frame the circular crop."}
                </p>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start rtl:sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#36ADA3] hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{isRTL ? "رفع صورة جديدة وقصها" : "Upload & Crop Photo"}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawImageToCrop(avatarUrl);
                      setCropperOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Crop size={14} />
                    <span>{isRTL ? "إعادة قص الحالية" : "Re-crop Current"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Personal Information Card */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-[#36ADA3]" />
              <span>{isRTL ? "بيانات السكرتارية الأساسية" : "Secretary Personal Details"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "اسمك وهاتفك للتواصل الإداري والتنسيق مع الأطباء"
                : "Your name and phone used for internal coordination and reception logs"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "الاسم الكامل *" : "Full Name *"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Ahmed"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#36ADA3] focus:border-transparent transition-all"
              />
            </div>

            {/* Direct Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "رقم الهاتف للتواصل" : "Contact Phone"}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01098765432"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#36ADA3] focus:border-transparent transition-all"
              />
            </div>

            {/* Account Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "البريد الإلكتروني (مرتبط بحساب Clerk)" : "Account Email (Clerk Login)"}
              </label>
              <input
                type="email"
                value={secretary.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 text-slate-400 text-xs sm:text-sm font-medium cursor-not-allowed"
              />
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "حالة الحساب" : "Account Status"}
              </label>
              <div className="flex items-center h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20">
                <span
                  className={`text-xs font-bold ${
                    secretary.status === "ACTIVE"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-500"
                  }`}
                >
                  ● {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Clinic Affiliation & Permissions */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-[#36ADA3]" />
              <span>{isRTL ? "العيادة والصلاحيات الممنوحة" : "Clinic Affiliation & Access Rights"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "الصلاحيات المعتمدة لحسابك من قِبل الطبيب المسؤول"
                : "Security privileges granted to your reception profile by the clinic lead"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {isRTL ? "اسم العيادة التابع لها:" : "Assigned Practice:"}
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                {clinic?.name || (isRTL ? "عيادة DOCTECH الرئيسية" : "DOCTECH Primary Practice")}
              </p>
              {clinic?.phone && (
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {clinic.phone} • {clinic.address || ""}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#36ADA3]" />
                <span>{isRTL ? "الصلاحيات المتاحة:" : "Active Permissions:"}</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {secretary.permissions.length === 0 ? (
                  <span className="text-slate-400 text-xs">
                    {isRTL ? "صلاحيات الاستقبال الأساسية" : "Standard Reception Access"}
                  </span>
                ) : (
                  secretary.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] font-bold text-[11px] border border-teal-200/50 dark:border-teal-800/40"
                    >
                      ✓ {perm}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Reminder Floating Bar */}
        {hasChanges && (
          <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
              <span className="text-xs font-semibold">
                {isRTL ? "لديك تعديلات غير محفوظة على ملفك" : "You have unsaved changes on your profile"}
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-[#36ADA3] hover:bg-teal-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {saving ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ الآن" : "Save Now")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
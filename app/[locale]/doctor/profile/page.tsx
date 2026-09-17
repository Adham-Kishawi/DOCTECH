"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  Building2,
  MapPin,
  Camera,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Clock,
  Crop,
} from "lucide-react";
import { toast } from "sonner";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

type DoctorProfile = {
  id: string;
  email: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  clinic_id: string;
};

type Clinic = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url?: string | null;
};

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
};

type ProfileResponse = {
  success: boolean;
  user: DoctorProfile;
  clinic: Clinic | null;
  schedules: Schedule[];
  error?: string;
};

const DAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAYS_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const COMMON_SPECIALTIES = [
  "Ophthalmology (Eyes)",
  "Cardiology (Heart)",
  "Pediatrics",
  "Internal Medicine",
  "Dermatology",
  "Orthopedics",
  "Dentistry",
  "General Surgery",
  "ENT (Ear, Nose & Throat)",
];

export default function DoctorProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Original profile copy for Reset
  const [originalProfile, setOriginalProfile] = useState<ProfileResponse | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cropper Modal State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  // Clinic State
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");

  // Schedules
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/doctor/profile", { cache: "no-store" });
        const data: ProfileResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load doctor profile");
        }

        setOriginalProfile(data);
        setName(data.user.name || "");
        setSpecialty(data.user.specialty || "");
        setAvatarUrl(data.user.avatar_url || null);

        if (data.clinic) {
          setClinicName(data.clinic.name || "");
          setClinicPhone(data.clinic.phone || "");
          setClinicAddress(data.clinic.address || "");
          setPhone(data.clinic.phone || "");
        }

        setSchedules(data.schedules || []);
      } catch (err) {
        console.error("Load doctor profile error:", err);
        setError("Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // When a user selects a file, read it and open Cropper Modal
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

    // reset input so user can choose the same file again if desired
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
    setSpecialty(originalProfile.user.specialty || "");
    setAvatarUrl(originalProfile.user.avatar_url || null);
    if (originalProfile.clinic) {
      setClinicName(originalProfile.clinic.name || "");
      setClinicPhone(originalProfile.clinic.phone || "");
      setClinicAddress(originalProfile.clinic.address || "");
      setPhone(originalProfile.clinic.phone || "");
    }
    toast.info(isRTL ? "تمت استعادة البيانات الأصلية" : "Changes reverted to original values");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isRTL ? "اسم الطبيب مطلوب" : "Doctor name is required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          specialty: specialty.trim() || null,
          avatar_url: avatarUrl,
          clinicName: clinicName.trim(),
          clinicPhone: clinicPhone.trim() || phone.trim() || null,
          clinicAddress: clinicAddress.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setOriginalProfile((prev) =>
        prev
          ? {
              ...prev,
              user: data.user,
              clinic: data.clinic,
            }
          : null
      );

      toast.success(
        isRTL
          ? "✨ تم حفظ التعديلات بنجاح في قاعدة البيانات!"
          : "✨ Profile updated successfully in database!"
      );
    } catch (err: any) {
      console.error("Save profile error:", err);
      toast.error(err.message || (isRTL ? "فشل حفظ التعديلات" : "Failed to save profile changes"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center px-4 py-12">
        <div className="w-full max-w-4xl min-h-[450px] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1A4B8C] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-400">
            {isRTL ? "جاري تحميل بيانات الملف الشخصي..." : "Loading doctor profile..."}
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
            {isRTL ? "الملف الشخصي للطبيب" : "Doctor Profile"}
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
            <p className="text-sm font-semibold text-red-400">
              {error || (isRTL ? "تعذر العثور على الملف الشخصي" : "Doctor profile not found")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const hasChanges =
    name !== (originalProfile.user.name || "") ||
    specialty !== (originalProfile.user.specialty || "") ||
    avatarUrl !== (originalProfile.user.avatar_url || null) ||
    clinicName !== (originalProfile.clinic?.name || "") ||
    clinicPhone !== (originalProfile.clinic?.phone || "") ||
    clinicAddress !== (originalProfile.clinic?.address || "");

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 mb-2">
              <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
              <span>{isRTL ? "حساب الطبيب المعتمد" : "Verified Practice Lead"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isRTL ? "الملف الشخصي للطبيب" : "Doctor Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "تخصيص بيانات الطبيب، الصورة الشخصية مع أداة القص، وإعدادات العيادة"
                : "Customize your credentials, upload and crop your personal photo, and manage clinic details"}
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
                  ? "bg-[#1A4B8C]/70 cursor-not-allowed"
                  : "bg-[#1A4B8C] hover:bg-blue-800 active:scale-98 shadow-blue-900/20"
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
                <Camera size={18} className="text-[#1A4B8C] dark:text-blue-400" />
                <span>{isRTL ? "الصورة الشخصية" : "Profile Picture"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL
                  ? "ارفع صورتك من جهازك مع إمكانية تحريكها وتكبيرها وقصها بالشكل الذي يناسبك"
                  : "Upload a photo from your device and crop/zoom it exactly as desired"}
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
                  <div className="w-full h-full bg-gradient-to-tr from-[#1A4B8C] to-[#3368A0] flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-black">{initials || "DR"}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-1">Doctor</span>
                  </div>
                )}
              </div>

              {/* Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#1A4B8C] text-white flex items-center justify-center shadow-lg hover:bg-blue-800 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
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
                    ? "اختر أي صورة من جهازك، وسيقوم النظام بفتح أداة القص لتحديد الجزء الذي تريد ظهوره وضبط المقاس بدقة."
                    : "Select any image from your computer; the cropper tool allows you to pan, zoom, and frame the exact circular crop."}
                </p>
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start rtl:sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A4B8C] hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
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

        {/* 2. Doctor Information Card */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-[#1A4B8C] dark:text-blue-400" />
              <span>{isRTL ? "بيانات الطبيب المهنية" : "Doctor Credentials & Info"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "الاسم والتخصص يظهران للمرضى وفي الروشتات وإشعارات الحجز"
                : "Your name and specialty appear on prescriptions, patient portals, and booking reminders"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "الاسم الكامل للطبيب *" : "Full Name *"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Adham Kishawi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "التخصص الطبي" : "Medical Specialty"}
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Ophthalmology, Eyes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />

              {/* Quick specialty suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_SPECIALTIES.slice(0, 4).map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSpecialty(spec)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    + {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "البريد الإلكتروني (مرتبط بـ Clerk)" : "Account Email (Clerk Auth)"}
              </label>
              <input
                type="email"
                value={originalProfile.user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 text-slate-400 text-xs sm:text-sm font-medium cursor-not-allowed"
              />
            </div>

            {/* Direct Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "رقم الهاتف المباشر" : "Personal / Practice Contact"}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01200586875"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. Clinic Information Card */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-[#1A4B8C] dark:text-blue-400" />
              <span>{isRTL ? "بيانات العيادة والمنشأة" : "Clinic & Practice Information"}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "اسم العيادة وعنوانها يظهران للسكرتارية والمرضى وفي الرسائل التلقائية"
                : "Clinic name and location are visible to all staff, on invoice headers, and in patient WhatsApp confirmations"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Clinic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "اسم العيادة *" : "Clinic Name *"}
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. AK Clinic"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />
            </div>

            {/* Clinic Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "هاتف العيادة الرسمي" : "Official Clinic Phone"}
              </label>
              <input
                type="text"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                placeholder="e.g. 01200586875"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />
            </div>

            {/* Clinic Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "عنوان العيادة والمقر" : "Physical Address / Location"}
              </label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="e.g. Building 12, Medical District, Cairo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* 4. Working Schedule Summary Card */}
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-[#1A4B8C] dark:text-blue-400" />
                <span>{isRTL ? "مواعيد وجدول العمل" : "Working Hours & Shift Schedule"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRTL
                  ? "الأيام والمواعيد المحددة لحجز الكشوفات وتوليد الفترات الزمنية"
                  : "Active working shifts used by reception to compute available booking slots"}
              </p>
            </div>

            <Link
              href={`/${locale}/doctor/schedule`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A4B8C] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
            >
              <span>{isRTL ? "الجدول السريري" : "View Timetable"}</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          {schedules.length === 0 ? (
            <p className="text-xs text-slate-400">
              {isRTL ? "لم يتم تحديد جدول عمل بعد." : "No working shifts configured yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedules.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isRTL ? DAYS_AR[shift.day_of_week] : DAYS_EN[shift.day_of_week]}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {shift.start_time} - {shift.end_time}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {shift.slot_duration}m
                  </span>
                </div>
              ))}
            </div>
          )}
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
                className="px-4 py-1.5 rounded-xl bg-[#1A4B8C] hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer"
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